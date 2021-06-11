const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json()); 

const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
var mysql = require("mysql"); // mysql 모듈을 불러옵니다.

// View engine 을 html로 설정
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

//파일 위치 동적화
app.use(express.static(__dirname + '/views'));

// 포트 번호 설정
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

// define db name
const userDB = 'user';
const recordDB = 'record';
const collectorDB = 'collector';

// get time
var moment = require('moment');
const { text } = require('body-parser');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
function getToday(){
  return moment().format('YYYY-MM-DD HH:mm:ss');
}

function run_query(myquery){
  connection.query(myquery, (err, rows, fields) => {
    res.send(rows); // 결과를 출력합니다!
  });
}

// 커넥션을 정의합니다.
// RDS Console 에서 본인이 설정한 값을 입력해주세요.
const connection = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database: conf.database // SCHEMAS
});

// RDS에 접속합니다.
connection.connect(function(err) {
  if (err) {
    throw err; // 접속에 실패하면 에러를 throw 합니다.
  } else {
    console.log("connect RDS!");
  }
});

/* 라우팅 */
app.get('/', (req, res) => {
  res.redirect('main');
})

// 화면 이동
app.get('/main', (req, res) => {
  res.render('main');
})

app.get('/user', (req, res)=>{
  connection.query(`SELECT * FROM ${userDB}`, (err, rows, fields) => {
    res.render('user', {data : 'test list ejs', user : rows}); // 결과를 출력합니다!
    });
})

app.get('/record', (req, res)=>{
  connection.query(`SELECT * FROM ${recordDB}`, (err, rows, fields) => {
    res.render('record', {data : 'test list ejs', record : rows}); // 결과를 출력합니다!
    });
})

app.get('/collector', (req, res)=>{
  connection.query(`SELECT * FROM ${collectorDB}`, (err, rows, fields) => {
    res.render('collector', {data : 'test list ejs', collector : rows}); // 결과를 출력합니다!
    });
})

app.get('/user_id', (req, res)=>{
  connection.query(`SELECT * FROM ${recordDB}`, (err, rows, fields) => {
    res.render('user_id', {data : 'test list ejs', record : null}); // 결과를 출력합니다!
    });
})

// 1. 모든 데이터 검색하기
app.get('/userSearch', (req, res) =>{

  if(req.query.searchText != ''){

    connection.query(`SELECT * FROM ${userDB} WHERE user_id LIKE ? `, '%'  + req.query.searchText + '%', (err, rows, fields) =>{
      res.render('user', {data : 'test list ejs', user : rows});
    });

  }
  else{

    connection.query(`SELECT * FROM ${userDB}`, (err, rows, fields) => {
      res.render('user', {data : 'test list ejs', user : rows}); // 결과를 출력합니다!
      });

  }

})

app.get('/api/get/user', (req, res) =>{

  connection.query(`SELECT * FROM ${userDB}`, (err, rows, fields) =>{
    res.send(rows)
  });

})

app.get('/recordSearch', (req, res) =>{

  if(req.query.searchText != ''){

    connection.query(`SELECT * FROM ${recordDB} WHERE id LIKE ? `, '%'  + req.query.searchText + '%', (err, rows, fields) =>{
      res.render('record', {data : 'test list ejs', record : rows});
    });

  }
  else{

    connection.query(`SELECT * FROM ${recordDB}`, (err, rows, fields) => {
      res.render('record', {data : 'test list ejs', record : rows}); // 결과를 출력합니다!
      });

  }

})

app.get('/collectorSearch', (req, res) =>{

  if(req.query.searchText != ''){

    connection.query(`SELECT * FROM ${collectorDB} WHERE collector_id LIKE ? `, '%'  + req.query.searchText + '%', (err, rows, fields) =>{
      res.render('collector', {data : 'test list ejs', collector : rows});
    });

  }
  else{

    connection.query(`SELECT * FROM ${collectorDB}`, (err, rows, fields) => {
      res.render('collector', {data : 'test list ejs', collector : rows}); // 결과를 출력합니다!
      });

  }

})

// 2. 사용자 아이디로 기록 검색하기
app.get('/idSearch', (req, res, next)=>{

  if(req.query.searchText != ''){

    connection.query(`SELECT * FROM ${recordDB} where user_id = ` + req.query.searchText, (err, rows, fields) =>{
      res.render('user_id', {data : 'test list ejs', record : rows});
    });

  }
  else{

    connection.query(`SELECT * FROM ${recordDB}`, (err, rows, fields) => {
      res.render('user_id', {data : 'test list ejs', record : null}); // 결과를 출력합니다!
      });

  }

})

// 회원가입
app.post('/api/post/user', function(req,res){  
  var inputData;
  req.on('data', (data) => {
    inputData = JSON.parse(data);
  });
  req.on('end', () => {
    console.log(
      `user_id : ${inputData.user_id}, 
      user_pw : ${inputData.user_pw}, 
      phone : ${inputData.phone}` );
    
      connection.query(
      `INSERT INTO ${userDB} (user_id, user_pw, phone) 
      values ("${inputData.user_id}", "${inputData.user_pw}", "${inputData.phone}")`
      
      , (err, rows, fields) => {
        res.send(err); // 쿼리 수행 완료!
    });
  });
});

// 기록 남기기
app.post('/api/post/record', function(req,res){  
  var inputData;
  req.on('data', (data) => {
    inputData = JSON.parse(data);
  });
  req.on('end', () => {
    console.log(
      `user_id : ${inputData.user_id},
      volume : ${inputData.volume}, 
      discharge_date : ${getToday()}, 
      inputData.collector_id : ${inputData.collector_id}` );

    connection.query(
      `INSERT INTO ${recordDB} (user_id, volume, discharge_date, collector_id) 
      values ("${inputData.user_id}", "${inputData.volume}", 
      "${getToday()}", "${inputData.collector_id}")`
      
      , (err, rows, fields) => {
        res.send(err); // 쿼리 수행 완료!
    });
  });
});

// 수거 기기 등록하기
app.post('/api/post/collector', function(req,res){  
  var inputData;
  req.on('data', (data) => {
    inputData = JSON.parse(data);
  });
  req.on('end', () => {
    console.log(
      `location : ${inputData.location}` );
    
      connection.query(
      `INSERT INTO ${collectorDB} (location) 
      values ("${inputData.location}")`
      
      , (err, rows, fields) => {
        res.send(err); // 쿼리 수행 완료!
    });
  });
});

// 아이디로 수거기 정보 업데이트
app.put('/api/put/collector/required/:collector_id', function(req,res){  
  var inputData;
  req.on('data', (data) => {
    inputData = JSON.parse(data);
  });
  req.on('end', () => {
    console.log("required : "+inputData.required);

    connection.query(
      `update ${collectorDB} set required = ${inputData.required}
      where collector_id = ${req.params.collector_id}`
      
      , (err, rows, fields) => {
        res.send("ok!"); // 결과를 출력합니다!
    });
  });
});

// 회원 탈퇴
app.delete('/api/delete/user', function(req,res){
  var inputData;
  req.on('data', (data) => {
    inputData = JSON.parse(data);
  });
  req.on('end', () => {
    console.log(`user_id : ${inputData.user_id}`);
    connection.query(`delete from ${userDB} where user_id = "${inputData.user_id}"`
      , (err, rows, fields) => {
        res.send(err); // 쿼리 수행 완료!
    });
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});