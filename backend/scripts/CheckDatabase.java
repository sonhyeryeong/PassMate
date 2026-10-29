import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

// Spring 설정과 migration을 거치지 않고 JDBC 인증 및 SELECT 1만 확인한다.
class CheckDatabase {
    public static void main(String[] args) {
        String url = System.getenv("PASSMATE_DB_URL");
        String user = System.getenv("PASSMATE_DB_USERNAME");
        String password = System.getenv("PASSMATE_DB_PASSWORD");
        if (url == null || user == null || password == null) {
            System.out.println("DB_CHECK_CONFIG_MISSING");
            System.exit(2);
        }
        Properties properties = new Properties();
        properties.setProperty("user", user);
        properties.setProperty("password", password);
        properties.setProperty("connectTimeout", "10");
        properties.setProperty("socketTimeout", "10");
        DriverManager.setLoginTimeout(15);
        try (var connection = DriverManager.getConnection(url, properties)) {
            connection.setReadOnly(true);
            try (var statement = connection.createStatement();
                 var result = statement.executeQuery("SELECT 1")) {
                if (!result.next() || result.getInt(1) != 1) {
                    throw new SQLException("Unexpected probe result", "02000");
                }
            }
            System.out.println("DB_AUTH_AND_SELECT_OK: Spring and migration were not run.");
        } catch (SQLException error) {
            // 자격 증명이나 접속 주소가 포함될 수 있는 예외 전문은 출력하지 않는다.
            System.out.println("DB_CHECK_FAILED SQLSTATE=" + error.getSQLState());
            if ("28P01".equals(error.getSQLState())) {
                System.out.println("DB_AUTH_REJECTED_WITHOUT_SPRING");
            }
            System.exit(1);
        }
    }
}
