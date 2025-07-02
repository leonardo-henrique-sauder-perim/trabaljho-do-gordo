-- Corrigir o e-mail do cliente com id = 2
UPDATE clientes
SET email = 'novoemail@example.com'
WHERE id_cliente = 2;

-- Alterar a data de nascimento de um cliente (por exemplo, o cliente com id = 1)
UPDATE clientes
SET data_nasc = '1992-04-15'
WHERE id_cliente = 1;

-- Alterar o endereço de um cliente com id = 3
UPDATE clientes
SET endereco = 'Nova Rua, 123, Centro'
WHERE id_cliente = 3;

-- Alterar o telefone do cliente com id = 4
UPDATE clientes
SET telefone = '(11) 99999-8888'
WHERE id_cliente = 4;
