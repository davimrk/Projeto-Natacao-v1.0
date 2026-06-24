const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "natacao",
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_HOST ? {rejectUnauthorized: false} : null
});
db.connect((erro) => {
  if (erro) {
    console.error("Erro ao conectar ao banco de dados:", erro);
  } else {
    console.log("Conectado ao banco de dados MySQL");
  }
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS alunos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      idade INT,
      telefone VARCHAR(20),
      nivel VARCHAR(50),
      horario VARCHAR(100),
      ativo boolean default true
    );
  `;

  db.query(createTableQuery, (erroTabela) => {
    if (erroTabela) {
      console.error("Erro ao criar tabela:", erroTabela);
    } else {
      console.log("Tabela 'alunos' criada com sucesso");
    }
  });
});

const app = express();
app.use(cors());
app.use(express.json());

let alunos = [];

app.get("/", (req, res) => {
  res.json({
    mensagem: "API funcionando",
  });
});
app.post("/alunos", (req, res) => {
  const { nome, idade, telefone, nivel, horario } = req.body;

  if (!nome || !idade || !telefone || !nivel || !horario) {
    return res.status(400).json({
      erro: "Preencha todos os campos.",
    });
  }
  if (idade < 5) {
    return res.status(400).json({
      erro: "Sua idade é abaixo do que o permitido.",
    });
  }
  if (idade > 100) {
    return res.status(400).json({
      erro: "Sua idade é acima do que o permitido.",
    });
  }
  if (nome.length < 3) {
    return res.status(400).json({
      erro: "O seu nome deve conter mais letras.",
    });
  }
  const verificasql = "SELECT * FROM alunos WHERE nome = ?";
  db.query(verificasql, [nome], (erro, resultado) => {
    if (erro) {
      console.error("Erro ao verificar aluno:", erro);
      return res.status(500).json({
        erro: "Erro ao verificar aluno.",
      });
    }
    if (resultado.length > 0) {
      return res.status(400).json({
        erro: "Já existe um aluno com este nome.",
      });
    }
    const insertsql =
      "INSERT INTO alunos (nome, idade, telefone, nivel, horario) VALUES (?, ?, ?, ?, ?)";
    db.query(
  insertsql,
  [nome, idade, telefone, nivel, horario],
  (erro, resultado) => {
    if (erro) {
      console.error("ERRO NO MYSQL:");
      console.error(erro);
      return res.status(500).json({
        erro: erro.message,
      });
    }

    res.status(201).json({
      mensagem: "Aluno cadastrado com sucesso.",
      id: resultado.insertId,
    });
  }
);
  });
});

app.get("/alunos", (req, res) => {
  db.query("SELECT * FROM alunos", (erro, resultado) => {
    if (erro) {
      return res.status(500).json({});
    }
    res.json(resultado);
  });
});

app.delete("/alunos/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM alunos WHERE id = ?", [id], (erro, resultado) => {
    if (erro) {
      return res.status(500).json(erro);
    }
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Aluno não encontrado.",
      });
    }
    res.json({
      mensagem: "Aluno deletado com sucesso.",
    });
  });
});

app.put("/alunos/:id", (req, res) => {
  const id = Number(req.params.id);
  db.query("SELECT * FROM alunos WHERE id = ?", [id], (erro, resultado) => {
    if (erro) {
      return res.status(500).json(erro);
    }
    if (resultado.length === 0) {
      return res.status(404).json({
        erro: "Aluno não encontrado.",
      });
    }
    const novoStatus = resultado[0].status === "ativo" ? "inativo" : "ativo";
    db.query(
      "UPDATE alunos SET status = ? WHERE id = ?",
      [novoStatus, id],
      (erro) => {
        if (erro) {
          return res.status(500).json(erro);
        }
        res.json({
          mensagem: "Aluno atualizado com sucesso.",
        });
      });
  });
});
let incorretas = 0;
let bloqueado = false;

app.post("/admin", (req, res) => {
  const { senha } = req.body;

  if (bloqueado === true) {
    return res.status(403).json({
      erro: "Tentativas excedentes.",
    });
  }

  if (!senha) {
    return res.status(400).json({
      erro: "Informe a senha.",
    });
  }

  if (senha === "admin123") {
    incorretas = 0;
    return res.json({ autenticado: true });
  }
  incorretas++;
  if (incorretas >= 3) {
    bloqueado = true;
    return res.status(403).json({
      erro: "Sistema bloqueado.",
    });
  }
  return res.status(401).json({
    erro: `Senha incorreta. Faltam ${3 - incorretas} tentativas restantes.`,
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando em: ");
  console.log(`http://localhost:${PORT}`);
});
