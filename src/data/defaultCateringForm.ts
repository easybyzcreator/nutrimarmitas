import { FormQuestion } from '../types';

export const DEFAULT_CATALOG2_FORM_TITLE = "Sua personal chef";

export const DEFAULT_CATALOG2_FORM_INTRO = `Meu nome é Alice Aquino e o meu propósito é levar mais praticidade, sabor e tranquilidade para a rotina da sua família.

Acredito que cada família é única. Cada casa tem sua rotina, seus hábitos, seus pratos preferidos e, muitas vezes, necessidades alimentares específicas.

Por isso, cada cardápio é planejado de forma personalizada, pensando no que realmente faz sentido para você e para a sua família.

Você pode escolher a opção que melhor atende à sua necessidade:

🏡 Na sua casa: você compra os ingredientes e eu preparo tudo na sua cozinha, deixando as refeições organizadas, etiquetadas e a cozinha limpa ao final do serviço.

🍱 Na minha cozinha: você compra os ingredientes e eu preparo tudo com o mesmo carinho e cuidado, deixando suas refeições prontas para facilitar a sua semana.

✨ Eu não preparo apenas refeições. Eu cuido da alimentação da sua família com carinho, organização e dedicação.

Será um prazer conhecer a sua rotina e montar um cardápio pensado especialmente para vocês. 💖

Com carinho,
Alice Aquino – Personal Chef`;

export const DEFAULT_CATALOG2_FORM_QUESTIONS: FormQuestion[] = [
  {
    id: 'q1',
    title: 'Tipo de Evento',
    type: 'select',
    required: true,
    options: ['Casamento', 'Aniversário', 'Corporativo', 'Jantar Privado', 'Outro']
  },
  {
    id: 'q2',
    title: 'Número estimado de Convidados',
    type: 'radio',
    required: true,
    options: ['Menos de 20', '20 a 50', '50 a 100', 'Mais de 100']
  },
  {
    id: 'q3',
    title: 'Data e Hora desejada do Evento',
    type: 'text',
    required: true
  },
  {
    id: 'q4',
    title: 'Local / Cidade do Evento',
    type: 'text',
    required: true
  },
  {
    id: 'q5',
    title: 'Restrições alimentares',
    type: 'select',
    required: false,
    options: ['Nenhuma', 'Vegano / Vegetariano', 'Sem Glúten', 'Sem Lactose', 'Outras']
  },
  {
    id: 'q6',
    title: 'Observações ou Serviços desejados',
    type: 'textarea',
    required: false
  }
];
