CREATE TABLE IF NOT EXISTS Cliente (
  ID_Cliente INT PRIMARY KEY AUTOINCREMENT,
  Nome VARCHAR (100) not NULL, 
  CPF CHAR(11) NOT NULL,
  RG VARCHAR(20) NOT NULL,
  Data_Nasc DATE,
  Telefone VARCHAR(20),
  Email VARCHAR(100),
  Endereco VARCHAR(200),
  UF CHAR(2),
  Sexo CHAR(1)
  );
  
  CREATE TABLE IF NOT EXISTS Barbeiro (
    ID_Barb INT PRIMARY KEY AUTOINCREMENT,
    Nome VARCHAR(100) not NULL,
    CPF CHAR(11) not NULL,
    RG VARCHAR(20) not NULL,
    Email VARCHAR(100),
    Telefone VARCHAR(20),
    Endereco VARCHAR(200),
    UF CHAR(2),
    Especialidade VARCHAR(100)
    );
    
    CREATE TABLe IF NOT EXISTS Servico (
      ID_Servico INT PRIMARY KEY AUTOINCREMENT,
      Nome VARCHAR(100) not NULL,
      Duracao TIME,
      Preco DECIMAL(10,2),
      Categoria VARCHAR(50),
      Descricao TEXT
      );
      
      CREATE TABLE IF NOT EXISTS Status (
        ID_Stat INT PRIMARY KEY AUTOINCREMENT,
        Nome VARCHAR(50) not NULL,
        Data_Criacao DATE,
        Data_Atualizacao DATE,
        Descricao TEXT
        );
        
        CREATE TABLE IF NOT EXISTS Agendamento (
          ID_Sg_Ag INT PRIMARY KEY AUTOINCREMENT,
          ID_Cliente INT,
          ID_Servico INT,
          ID_Barb INT,
          Hora_Ag TIME,
          Data_Ag DATE,
          Observacao TEXT,
          FOREIGN KEY (ID_Cliente) REFERenCES Cliente(ID_Cliente),
          FOREIGN KEy (ID_Servico) REFERENCES Servico(ID_Servico),
          FOREign KEY (ID_Barb) REFErences Barbeiro(ID_Barb)
          );
          
          CREATE TABLE IF NOT EXISTS Pagamento (
            ID_Pagamento INT PRIMARY KEY AUTOINCREMENT,
            ID_Cliente INT,
            ID_Servico INT,
            ID_Barb INT,
            Data DATE,
            Valor DECIMAL(10,2),
            Relatorio TEXT,
            FOREIGN KEy (ID_Cliente) REFEREnces Cliente(ID_Cliente),
            fOREIGN KEy (ID_Servico) REFEREnces Servico(ID_Servico),
            fOREIGN KEy (ID_Barb) REFEREnces Barbeiro(ID_Barb),
            );
            