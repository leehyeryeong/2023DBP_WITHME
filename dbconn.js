const oracledb = require('oracledb');
require('dotenv').config();

const dbConfig = require('./dbconfig');

async function connectAndQuery() {
    let connection;

    try {
        // 데이터베이스 연결
        connection = await oracledb.getConnection(dbConfig);

        // SQL문 실행
        const sql = 'SELECT * FROM POSTS';
        const result = await connection.execute(sql);

        // 결과 출력
        result.rows.forEach(row => {
            console.log(row);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            try {
                // 연결 종료
                await connection.close();
            } catch (error) {
                console.error('Error closing connection:', error);
            }
        }
    }
}

connectAndQuery();