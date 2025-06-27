-- Listar todos os clientes
SELECT * FROM clientes;

-- Listar todos os clientes ordenados por nome
SELECT * FROM clientes
ORDER BY nome;

-- Clientes registrados após um ano específico (exemplo: 1990)
SELECT nome, data_nasc 
FROM clientes
WHERE data_nasc > '1990-01-01';

-- Listar clientes com o nome da cidade (assumindo que você tenha uma tabela `enderecos`)
SELECT clientes.nome, enderecos.cidade 
FROM clientes
JOIN enderecos ON clientes.id_cliente = enderecos.id_cliente;

-- Mostrar empréstimos feitos pelos clientes, com nome do cliente e o nome do livro (assumindo que haja uma tabela `emprestimos` e `livros`)
SELECT clientes.nome AS cliente, livros.titulo, emprestimos.data_emprestimo, emprestimos.data_devolucao
FROM emprestimos
JOIN clientes ON emprestimos.id_cliente = clientes.id_cliente
JOIN livros ON emprestimos.id_livro = livros.id_livro;

-- Empréstimos feitos por um cliente específico (exemplo: "Ana Souza")
SELECT livros.titulo, emprestimos.data_emprestimo
FROM emprestimos
JOIN clientes ON emprestimos.id_cliente = clientes.id_cliente
JOIN livros ON emprestimos.id_livro = livros.id_livro
WHERE clientes.nome = 'Ana Souza';

-- Clientes de uma cidade específica (exemplo: "São Paulo")
SELECT clientes.nome
FROM clientes
JOIN enderecos ON clientes.id_cliente = enderecos.id_cliente
WHERE enderecos.cidade = 'São Paulo';
