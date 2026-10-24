Desenvolva um sistema conforme a estrutura de épocas do ciclo de desenvolvimento de software descritos abaixo

Contexto e regras de negócio: docs/*

## Época 0 - BD: Estruturação do Banco de Dados PostgreSQL.

Seguir contexto do arquivo Promptstart.md, dentro de prompts/*. 

## Época 1 - BackEnd: Funções para o BD e para a entrada de dados

Nessa época do ciclo de desenvolvimento, é necessário desenvolver, no Backend:

1. Funções de leitura sequencial no arquivo CSV enviado. Para cada Recebível (nota) lido no CSV, é necessário fazer uma avaliação inicial quanto a duplicatas. O comportamento do Backend para essas duplicatas segue a seguinte regra:
    1. Na submissão das notas para a tabela: Em caso de notas duplicadas, a submissão da nota para a tabela deve ser impedida. Exceção: Caso em que a nota já existe na tabela, mas como recusada, e a duplicata da nota é de um status que é aceitável: a nota deve ser atualizada com as informações da duplicata.
2. Funções de validação de cada Recebível conforme as restrições do fundo associado. Isso define se é uma nota aprovada ou não (status da nota) para antecipação de pagamento! Notas não duplicadas, mesmo que reprovadas para antecipação, devem aparecer na tabela.
3. Função de precificação: aplicar taxa de desconto no valor a ser pago do Fundo para o Cedente. Presente no JSON a ser submetido pelo Fundo, com a chave “precificação”.
4. Funções de Inserção, Atualização e Seleção paginada (de 20 em 20 registros) das linhas lidas (e válidas conforme seção 1) do CSV.

### Sobre as validações das notas

As validações são feitas conforme restrições únicas ao Fundo associado a ela. O JSON validadores_antecipe.json mostra como essas restrições são estruturadas.

As restrições de qualquer fundo possui exatamente esses códigos de validadores, mas podem ter valores de parâmetros diferentes. Explicações mais claras estão presentes nas regras de negócio.

Em caso de resultar uma nota em inválida conforme alguma das restrições, é necessário adicionar o corrido a um log de registro (pode ser um .txt ou um .csv) que associa a nota validada com o tipo de erro de validação na qual foi barrada de ser inserida na tabela, ou foi rejeitada para antecipação do pagamento, conforme código (estrutura parecida com a do arquivo resultado_esperado_100k.json):

```json
# em caso de aprovação
{ linha: 2, id: "526207", status: "APROVADO" }

# em caso de rejeição
{ linha: 99, id: "1-30325", status: "BARRADO", barrado_por: [ "CONCENTRACAO_MAXIMA_SACADO" ] }
```

## Época 2 - FrontEnd: Estruturar as facetas do sistema e a organização da interface.

Alterar o projeto conforme padrões de design pré-existentes para o frontend.

O sistema possui duas facetas (fazer uma barra nav que transita entre as duas facetas):

1. Área dos Cedentes:
    1. O cedente visualiza as notas que submeteu para um fundo em uma tabela, onde cada linha é uma nota. A tabela possui informações como o nome do fundo, valor da nota, status de aprovação/reprovação, entre outros.
    2. Para cada linha, há um toggle que possui informações mais detalhadas sobre as notas, e em caso de status rejeitado, terá uma explicação do motivo pela rejeição, conforme as restrições do respectivo fundo vinculado.
    3. Na submissão das notas para a tabela: Em caso de notas duplicadas, a submissão da nota deve ser barrada. Exceção: Caso em que a nota já existe na tabela, mas como recusada, e a duplicata da nota é de um status que é aceitável: a nota deve ser atualizada com as informações da duplicata.
    4. A tabela será paginada, mostrando de 20 em 20 registros de notas. Deve, também, ser filtrável para cada campo de informações das notas.
2. Área dos Fundos: Possui somente um Dashboard com informações de validação, informações pessoais do Fundo e Precificação, conforme arquivo validadores_antecipe.json.
    1. O gestor de fundos submete um JSON com todos os seus validadores e informações como nome e taxa de precificação no Dashboard, assim como o exemplo presente em validadores_antecipe.json.
    2. O JSON submetido preenche um formulário com campos (são fixos para qualquer fundo). Deve ser possível simplesmente preencher o formulário à mão (todos os campos são obrigatórios para serem salvos no banco de dados), ou enviar um JSON ao sistema, assim como os dados existentes no formulário devem ser exportáveis no formato JSON. Os dados submetidos pelo JSON definem quais notas (Recebíveis) serão aprovadas/reprovadas, assim como a precificação final do valor a pagar para o cedente e o valor a reter para o próprio fundo.
    3. Quanto à atualização dos dados do formulário com um novo JSON: Caso mude valores de validação, as notas que antes eram aprovadas não podem se tornar rejeitadas, mas as antes rejeitadas podem se tornar aprovadas, caso coincida com a nova validação. A precificação também precisa ser atualizada em tempo real. A visualização dessas notas e precificação sendo atualizadas ocorrem através da Área dos respectivos Cedentes.