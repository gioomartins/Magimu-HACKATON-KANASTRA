Crie uma tabela para cedentes, e uma tabela para fundos, ambas referenciam a tabela de usuários (que possuem usuário e senha) para referenciar seu respectivo cadastro na plataforma.

A tabela de cedentes deve ter os campos nome e código (CNPJ).
A tabela de fundos deve ter os campos nome e código (CNPJ), além dos valores necessários de substituir para as validações (para cada validação deve existir um campo booleano para verificar se está ativo ou não, e outro para o valor, caso exista conforme o JSON modelo)

Os dados presentes nessas tabelas, agora, servem para preencher dinamicamente a Área de cedente ou de fundo (conforme cada caso). Antes eram hardcoded conforme JSONS e modelos prontos.

Portanto, quando um usuário for se cadastrar como cedente, a página de cadastro deve exigir nome e CNPJ, e caso o usuário for se cadastrar como fundo, deve exigir nome e CNPJ. (Não esquecer de cadastrar na tabela de usuários e em suas respectivas tabelas ( cedentes ou fundos))