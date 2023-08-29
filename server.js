const app = require('./app'); // app.js 파일을 불러옴

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});