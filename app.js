const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/css', express.static('css'));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs'); // EJS 뷰 엔진 사용 설정
app.set('views', path.join(__dirname, 'views')); // 뷰 템플릿 파일이 있는 디렉토리 설정

app.get('index', (req, res) => {
  res.sendFile(__dirname + '/views/index.ejs');
});

app.get('/inputpage', (req, res) => {
  res.sendFile(__dirname + '/html/inputpage.html');
});

app.get('/inputpage.html', (req, res) => {
  res.sendFile(__dirname + '/html/inputpage.html');
});

function formatDate(date) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(date).toLocaleDateString('en-US', options);
}

app.get('/', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);

    const sql = `SELECT post_id, author, post_title, create_date FROM posts ORDER BY post_id`;

    const result = await connection.execute(sql);

    const fetchedData = result.rows.map(row => {
      const formattedDate = formatDate(row[3]); // row[3]는 create_date 컬럼
      return {
        post_id: row[0],
        author: row[1],
        post_title: row[2],
        create_date: formattedDate
      };
    });

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

    const sql = `SELECT post_id, author, post_title, content, create_date FROM posts WHERE post_id = :postId`;
    const binds = { postId };

    const result = await connection.execute(sql, binds);

    const postInfo = result.rows[0];

    await connection.close();

    // 데이터를 가공하여 날짜 형식을 변경 후 렌더링
    const formattedPostInfo = {
      post_id: postInfo[0],
      author: postInfo[1],
      post_title: postInfo[2],
      content: postInfo[3],
      create_date: formatDate(postInfo[4]) // create_date 컬럼의 날짜 포맷 변경
    };

    // 데이터를 HTML 템플릿에 삽입하여 렌더링
    res.render('detail', { postInfo: formattedPostInfo });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('오류가 발생했습니다.');
  }
});

app.get('/edit/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const sql = `SELECT post_id, post_title, content FROM posts WHERE post_id = :postId`;
    const binds = { postId };

    const result = await connection.execute(sql, binds);
    const postInfo = result.rows[0];

    await connection.close();

    res.render('edit', { postInfo });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('오류가 발생했습니다.');
  }
});

app.post('/edit/:postId', async (req, res) => {
  const postId = req.params.postId;
  const newPostTitle = req.body.newPostTitle;
  const newContent = req.body.newContent

  try {
    const connection = await oracledb.getConnection(dbConfig);

    const checkPasswordSql = `SELECT password FROM posts WHERE post_id = :postId`;
    const checkPasswordBinds = { postId };

    const checkPasswordResult = await connection.execute(checkPasswordSql, checkPasswordBinds);
    const correctPassword = checkPasswordResult.rows[0][0];

    await connection.close();

    if (req.body.password !== correctPassword) {
      res.status(400).send('비밀번호가 일치하지 않습니다. 수정이 취소되었습니다.');
      return;
    }

    const updateSql = `UPDATE posts SET post_title = :newPostTitle, content = :newContent WHERE post_id = :postId`;
    const updateBinds = {
      newPostTitle,
      newContent,
      postId
    };

    const updateConnection = await oracledb.getConnection(dbConfig);
    await updateConnection.execute(updateSql, updateBinds, { autoCommit: true });
    await updateConnection.close();

    res.redirect(`/detail/${postId}`); // 수정 성공 시 detail 페이지로 이동
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('오류가 발생했습니다.');
  }
});

module.exports = app;