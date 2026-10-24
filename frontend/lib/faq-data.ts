export interface FaqItem {
  pergunta: string
  resposta: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    pergunta: 'Como funciona a antecipação de recebíveis no Antecipe?',
    resposta:
      'Sua empresa envia um arquivo CSV com as notas fiscais emitidas (duplicatas mercantis ou de serviços). O Antecipe submete cada título ao motor de validação do FIDC parceiro, retornando na hora quais notas foram aprovadas, quais foram recusadas e a simulação líquida com o desconto aplicado.',
  },
  {
    pergunta: 'O que acontece se uma nota já tiver sido enviada anteriormente?',
    resposta:
      'O sistema possui trava de idempotência garantida por índice único no banco de dados. Uma nota aprovada nunca é duplicada. Caso a nota anterior tenha sido recusada e agora cumpra todos os requisitos com novas regras, o sistema atualiza o status para aprovado com recálculo automático do valor líquido.',
  },
  {
    pergunta: 'Por que uma nota fiscal pode ser recusada pelo fundo?',
    resposta:
      'As notas podem ser recusadas por extrapolar o prazo máximo estabelecido pelo FIDC (ex: mais de 180 dias), por concentração excessiva no mesmo sacado (ex: acima de 10% da carteira por raiz de CNPJ), por situação cadastral irregular do sacado na Receita Federal ou por valor abaixo do mínimo permitido.',
  },
  {
    pergunta: 'Como é calculada a taxa de desconto e o valor líquido a receber?',
    resposta:
      'Utilizamos o modelo de Desconto Simples Comercial (pró-rata die). A taxa mensal definida pelo fundo é aplicada proporcionalmente aos dias corridos entre a data-base da operação e o vencimento do título: Desconto = Valor Nominal × (Taxa Mensal × (Dias / 30)). O valor líquido é a diferença direta entre o valor de face e o desconto.',
  },
  {
    pergunta: 'O gestor do fundo pode alterar as regras sem precisar de desenvolvimento?',
    resposta:
      'Sim. Na Faceta dos Fundos da plataforma Antecipe, o gestor pode ativar ou desativar validadores, alterar prazos e percentuais de concentração e ajustar a taxa mensal diretamente na interface ou via importação de arquivo JSON de configuração.',
  },
  {
    pergunta: 'Quais tipos de recebíveis são aceitos na plataforma?',
    resposta:
      'A plataforma foi projetada para aceitar Duplicatas Mercantis e Duplicatas de Prestação de Serviços devidamente registradas e acompanhadas de documento fiscal com CNPJ válido e situação cadastral ativa.',
  },
]
