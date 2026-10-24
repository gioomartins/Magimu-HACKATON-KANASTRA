# Hackathon Antecipe: dataset para os participantes

## O desafio: portal Antecipe

**O problema:** uma pequena empresa vendeu a prazo e quer o dinheiro hoje. Ela “vende” essas notas para o fundo, mas o fundo só pode comprar o que cumpre regras: prazo máximo, valor mínimo, sacado (quem vai pagar) não pode estar concentrado demais, CNPJ ativo etc.

**O que os times constroem:**

- **Design:** a jornada da empresa, do upload das notas até ver quanto vai receber e por que algumas foram recusadas. O desafio de UX é explicar a recusa de forma clara.
- **Front:** upload de lote (CSV), tabela com status por nota e simulação do valor líquido (valor de face menos o desconto).
- **Back:** API que valida cada recebível contra critérios de elegibilidade configuráveis e calcula o preço de compra com uma taxa de desconto simples.
- **Arquitetura:** como modelar um motor de regras que o gestor do fundo altere sem deploy, e como garantir que o mesmo recebível não seja vendido duas vezes (idempotência e duplicidade).

## Arquivos

Dados para o desafio **Antecipe**. Baixe os dois arquivos abaixo:

- **Estoque:** a carteira já comprada por 18 fundos, com cerca de 100 mil linhas (um único CSV, `estoque_antecipe.csv`, dentro do zip).
- **Validadores:** a configuração das regras do ANTECIPE FIDC. Cada validador tem um `codigo`, a chave `ativo` (só os ativos valem) e os `parametros`.

estoque_antecipe_100k.zip

validadores_antecipe.json

## Requisitos mínimos de entrega

**Prazo:** até as **18h de sábado**. Projetos enviados depois não são avaliados.

1. **Repositório com o código**, com acesso liberado para os jurados.
2. **README com o passo a passo para rodar a aplicação do zero:** dependências, comandos e variáveis de ambiente. Linguagem, framework e infraestrutura são livres.
3. **Aplicação funcionando**, com:
    - upload de um CSV de notas no mesmo formato do arquivo de exemplo (separador `;`, decimal com vírgula, datas `dd/mm/aaaa`);
    - regras lidas do `validadores_antecipe.json`, sem valores fixos no código;
    - resultado de cada nota: **aprovada ou recusada** e, se recusada, **o motivo**, explicado de um jeito que a empresa entenda;
    - **valor líquido** de cada nota aprovada e o **total a receber**;
    - a mesma validação disponível **pela tela e por uma API**.
4. **Relatório curto** (pode estar no README): o que o time construiu, as tecnologias usadas, as principais decisões e o que ficou de fora.
5. **Histórico dos prompts de IA** usados durante o projeto (exportado ou em arquivo de texto).
6. **Apresentação aos jurados:** o time mostra a solução funcionando e responde perguntas.

## Formato do CSV

Separador `;`, decimal com vírgula, datas `dd/mm/aaaa`, UTF-8, cabeçalho na primeira linha. Data-base dos dados: 22 de outubro de 2026.

| Coluna | Significado |
| --- | --- |
| `NOME_FUNDO`, `DOC_FUNDO` | Fundo que comprou a nota |
| `NOME_CEDENTE`, `DOC_CEDENTE` | Empresa que vendeu a nota |
| `NOME_SACADO`, `DOC_SACADO` | Cliente que vai pagar a nota |
| `NU_DOCUMENTO` | Número da nota no sistema do cedente (cada empresa numera do seu jeito) |
| `TIPO_RECEBIVEL` | Duplicata, Duplicata de Serviço, Cheque, CCB ou Nota Comercial |
| `VALOR_NOMINAL` | Valor de face, em reais |
| `DATA_VENCIMENTO_ORIGINAL` | Data de vencimento |
| `DATA_AQUISICAO` | Data em que o fundo comprou a nota |