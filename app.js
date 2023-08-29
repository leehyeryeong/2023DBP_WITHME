const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/css', express.static('css'));

app.set('view engine', 'ejs'); // EJS 뷰 엔진 사용 설정
app.set('views', path.join(__dirname, 'views')); // 뷰 템플릿 파일이 있는 디렉토리 설정

app.get('/inputpage', (req, res) => {
  res.sendFile(__dirname + '/html/inputpage.html');
});

app.get('/inputpage.html', (req, res) => {
  res.sendFile(__dirname + '/html/inputpage.html');
});

app.get('/', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);

    const sql = `SELECT post_id, author, post_title, create_date FROM posts`;

    const result = await connection.execute(sql);

    const fetchedData = result.rows;

    await connection.close();

    res.render('index', { fetchedData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('오류가 발생했습니다.');
  }
});

app.post('/write', async (req, res) => {
  const { postTitle, postContent, authorName, password } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const sql = `INSERT INTO posts (post_id, post_title, content, author, password, create_date)
                 VALUES (POSTSEQ.NEXTVAL, :postTitle, :postContent, :authorName, :password, SYSDATE)`;

    const binds = {
      postTitle,
      postContent,
      authorName: authorName || '익명',
      password
    };

    await connection.execute(sql, binds, { autoCommit: true });

    await connection.close();

    res.json({ message: '글이 성공적으로 작성되었습니다.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: '글 작성 중 오류가 발생했습니다.' });
  }
});

app.get('/detail/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const sql = `SELECT author, content, create_date FROM posts WHERE post_id = :postId`;
    const binds = { postId };

    const result = await connection.execute(sql, binds);

    const postInfo = result.rows[0]; // 첫 번째 결과만 사용 (단일 게시글 상세 정보)

    await connection.close();

    // 데이터를 HTML 템플릿에 삽입하여 렌더링
    res.render('detail', { postInfo });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('오류가 발생했습니다.');
  }
});

module.exports = app;