import { prisma } from '../../../database/prismaClient';
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';

interface ILoadCatalog {
  filename: string;
}

interface ICadServico {
  GrpServico: string;
  Descricao?: string;
  Dominio?: string;
}

interface ICadEvento {
  CodEvento?: string;
  NomeEvento?: string;
  Fluxo?: string;
  GrpServicoId: string;
}

interface ICadMensagem {
  CodMsg?: string;
  Tag?: string;
  Descricao: string;
  EntidadeOrigem?: string;
  EntidadeDestino?: string;
  CodEventoId?: string;
}

interface ICadMensagemDado {
  CodMsg: string;
  CodMsgseq?: Number;
  Tag?: string;
  NomeCampo?: string;
  Mult?: string;
  Ou?: string;
}

// seleciona no pdf o Grupo de Serviço
const regexGrupoServico = /(Grupo de Serviços) ([A-Z]{3}) (?!.)+/g;

// seleciona no pdf o O Domínio do Sistema
const regexDominio =
  /(Este grupo de serviços pertence ao domínio de sistema) ([A-Z0-9]*)/g;

// seleciona Evento
const regexEvento = /Evento ([A-Z]{3}[0-9]{4})( - )([A-za-z0-9\S ]+)/;

// seleciona descrição da mensagem
const regexMensagem = /(?<!Código )(Mensagem: )([A-za-z0-9\S ]+)/g;
// seleciona Código da mensagem
const regexCodigoMensagem =
  /(Código Mensagem: )([A-Z]{3}[0-9]{4}E{0,1}R{0,1}[ 123]{0,1})( Emissor:)([ A-Za-z0-9á_çãõâ\S]+)([ +]{0,})(Destinatário:)([ A-Za-z0-9á_çãõâ\S]+)/;
// seleciona Fluxo do Evento
const regexEventoFluxo =
  /Mensagens Associadas Fluxo do Evento: ([A-za-z0-9\S]+)/g;

// seleciona Tag da Mensagem
const regexMensagemTag = /<([A-Z]{3}[0-9]{4}E{0,1}R{0,1}[0123]{0,1})>/g;

// seleciona sequencia Mensagem
const regexSeqMensagemSel = /([0-9]{1,3})[ ]+([<|<\/]{1,2}[A-Za-z0-9_]+>)[ ]+/;
const regexSeqMensagemParse =
  /([0-9]{1,3})[ ]+([<|<\/]{1,2}[A-Za-z0-9_]+>)[ ]+([A-Za-z0-9á_çãõâ_\S ]+)(\[[0-9]{1,3}[.]{1,3}[0-9n]{1,3}\])[ ]*(OU\({0,3}|\){0,1})/;

const regexOU = /^[ ]*(OU\(|^\))/;

var startArqReference = false;
var lineReference = 0;
var cadServicos = [] as ICadServico[];
var cadEventos = [] as ICadEvento[];
var cadMensagens = [] as ICadMensagem[];
var cadMensagemDados = [] as ICadMensagemDado[];
var cadUpdateMensagemDados = [] as ICadMensagemDado[];
var cadUpdateMensagemDadosUpdate = [] as any[];
var cadServico = {} as ICadServico;
var cadEvento = {} as ICadEvento;
var cadMensagem = {} as ICadMensagem;
var cadMensagemDado = {} as ICadMensagemDado;
var cadUpdateMensagemDado = {} as ICadMensagemDado;

async function ProcessCatalog(line: string, index: number) {
  // get group service
  if (line.match(regexGrupoServico)) {
    var parseText = <string[]>regexGrupoServico.exec(line);
    var [, , GrpServico] = parseText;
    cadServico = { GrpServico: GrpServico };
    lineReference = index + 2;
    startArqReference = true;
    return;
  }

  if (!startArqReference) return;

  // get Service Descricao
  if (lineReference === index) {
    cadServico = { ...cadServico, Descricao: line };
    return;
  }

  // get Dominio
  if (line.match(regexDominio)) {
    var parseText = <string[]>regexDominio.exec(line);
    var [, , Dominio] = parseText;
    cadServico = { ...cadServico, Dominio: Dominio };
    cadEvento = { GrpServicoId: cadServico.GrpServico };
    cadServicos = [...cadServicos, cadServico];
    return;
  }
  // get Evento
  if (line.match(regexEvento)) {
    var parseText = <string[]>regexEvento.exec(line);
    const [, CodEvento, , NomeEvento] = parseText;
    cadEvento = {
      ...cadEvento,
      CodEvento: CodEvento,
      NomeEvento: NomeEvento,
    };
    return;
  }
  // get Evento
  if (line.match(regexEventoFluxo)) {
    var parseText = <string[]>regexEventoFluxo.exec(line);
    const [, Fluxo] = parseText;
    cadEvento = { ...cadEvento, Fluxo };
    cadEventos = [...cadEventos, cadEvento];
    return;
  }
  // get Mensagem
  if (line.match(regexMensagem)) {
    var parseText = <string[]>regexMensagem.exec(line);
    const [, , Descricao] = parseText;
    cadMensagem = { CodEventoId: cadEvento.CodEvento, Descricao };
    return;
  }

  // if (test) console.log(line);
  // get Cod Mensagem
  if (line.match(regexCodigoMensagem)) {
    var parseText = <string[]>regexCodigoMensagem.exec(line);
    var [, , CodMsg, , EntidadeOrigem, , , EntidadeDestino] = parseText;
    // if (CodMsg.startsWith('DDA0001', 0)) {
    //   console.log(`parseText: ${parseText}`);
    //   console.log(`CodMsg: ${CodMsg}`);
    //   console.log(`EntidadeOrigem: ${EntidadeOrigem}`);
    //   console.log(`EntidadeDestino: ${EntidadeDestino}`);
    // }
    cadMensagem = {
      ...cadMensagem,
      CodMsg,
      Tag: `<${CodMsg.trim()}>`,
      EntidadeOrigem: EntidadeOrigem.trim(),
      EntidadeDestino: EntidadeDestino.trim(),
    };
    cadMensagens = [...cadMensagens, cadMensagem];
    return;
  }

  // get Mensagem Tag
  if (line.match(regexMensagemTag)) {
    var parseText = <string[]>regexMensagemTag.exec(line);
    const [, CodMsg] = parseText;
    // console.log(CodMsg);
    cadMensagemDado = { CodMsg };
    cadUpdateMensagemDado = cadMensagemDado;
    return;
  }

  // get Cod Mensagem
  if (line.match(regexSeqMensagemSel)) {
    var parseText = <string[]>regexSeqMensagemParse.exec(line);
    var [, CodMsgseq, Tag, NomeCampo, Mult, Ou] = parseText || {};
    // console.log(cadMensagemDado.CodMsg, CodMsgseq);
    cadMensagemDado = {
      CodMsg: cadMensagemDado.CodMsg,
      CodMsgseq: Number(CodMsgseq),
      Tag,
      NomeCampo,
      Mult,
      Ou,
    };
    cadUpdateMensagemDado = cadMensagemDado;
    cadMensagemDados = [...cadMensagemDados, cadMensagemDado];
    // console.log(cadMensagemDado);
    return;
  }

  if (line.match(regexOU)) {
    var parseText = <string[]>regexOU.exec(line);
    var [, Ou] = parseText;
    cadUpdateMensagemDado = {
      ...cadUpdateMensagemDado,
      Ou,
    };
    cadUpdateMensagemDados = [...cadUpdateMensagemDados, cadUpdateMensagemDado];
    return;
  }
  return;
}

export class LoadCatalogUseCase {
  async execute({ filename }: ILoadCatalog) {
    const buffer = await fs.readFile(filename);

    const data = await pdfParse(buffer);

    // process lines
    const lines = data.text.split(/\r?\n/);

    lines.forEach(async (line, index) => {
      // ignore empty line
      if (line.trim() === '') return;

      await ProcessCatalog(line, index);
    });

    const resultServicos = await prisma.catGrupoServico.createMany({
      data: cadServicos as [],
      skipDuplicates: true,
    });

    const resultEvento = await prisma.catEvento.createMany({
      data: cadEventos as [],
      skipDuplicates: true,
    });

    function filtroMsg(item: ICadMensagem) {
      return item.CodMsg?.substring(0, 3) === 'DDA';
    }

    // const newArrayMsg = cadMensagens.filter(filtroMsg);
    // console.log(newArrayMsg);

    // const resultMensagem = await prisma.catMensagem.createMany({
    //   data: newArrayMsg as [],
    //   skipDuplicates: true,
    // });
    const resultMensagem = await prisma.catMensagem.createMany({
      data: cadMensagens as [],
      skipDuplicates: true,
    });
    // function filtro(item: ICadMensagemDado) {
    //   return item.CodMsg.substring(0, 6) === 'DDA001';
    // }

    // const newArray = cadMensagemDados.filter(filtro);
    // console.log(newArray);

    // const resultMensagemDados = await prisma.catMensagemDado.createMany({
    //   data: newArray as [],
    //   skipDuplicates: true,
    // });

    const resultMensagemDados = await prisma.catMensagemDado.createMany({
      data: cadMensagemDados as [],
      skipDuplicates: true,
    });

    cadUpdateMensagemDados.forEach(async (regUpdate: ICadMensagemDado) => {
      const resultMensagemDadosUpdate = await prisma.catMensagemDado.update({
        where: {
          CodMsg_CodMsgseq: {
            CodMsg: regUpdate.CodMsg,
            CodMsgseq: Number(regUpdate.CodMsgseq),
          },
        },
        data: {
          Ou: regUpdate.Ou,
        },
      });
      cadUpdateMensagemDadosUpdate = {
        ...cadUpdateMensagemDadosUpdate,
      };
      console.log(`MensagemDadosUpdate: ${resultMensagemDadosUpdate}`);
    });
    return {
      Info: data.info.Title,
      Author: data.info.Author,
      TotalPages: data.numpages,
      servicos: resultServicos.count,
      eventos: resultEvento.count,
      mensagens: resultMensagem.count,
      mensagensDados: resultMensagemDados.count,
      mensagensDadosUpdate: JSON.stringify(cadUpdateMensagemDadosUpdate),

      // teste: newArrayMsg,
    };
  }
}

//       if (line.match(regexMensagem)) {
//         var parseText = <string[]>regexMensagem.exec(line);
//         [, , EventoDescricao] = parseText;
//         // parseJSon = {
//         //   ...parseJSon,
//         //   Evento: {
//         //     Evento: parseJSon.Evento?.Evento,
//         //     Mensagem: {
//         //       Descricao: Descricao,
//         //     },
//         //   },
//         // };
//         // console.log(parseJSon);

//         // prisma.catEventos
//         //   .create({
//         //     data: {
//         //       Evento,
//         //       Descricao: EventoDescricao,
//         //       ServicoId,
//         //     },
//         //   })
//         //   .then((result) => {
//         //     EventoId = result.id;
//         //     console.log(`Evento: ${Evento}`);
//         //     console.log(`Descricao: ${EventoDescricao}`);
//         //     console.log(`ServicoId: ${ServicoId}`);
//         //   })
//         //   .catch((err) => {
//         //     throw new Error(`error create catEventos ${err.Mensagem}`);
//         //   });

//
//       }

//       if (line.match(regexCodigoMensagem)) {
//         // var parseText = <string[]>regexCodigoMensagem.exec(line);
//         // var [, , Mensagem, , ,iEntidadeOrigem, , , EntidadeDestino] = parseText;
//         // parseJSon = {
//         //   ...parseJSon,
//         //   Evento: {
//         //     Evento: parseJSon.Evento?.Evento,
//         //     Mensagem: {
//         //       Mensagem: Mensagem,
//         //       Descricao: parseJSon.Evento?.Mensagem?.Descricao,
//         //       EntidadeOrigem: EntidadeOrigem,
//         //       EntidadeDestino: EntidadeDestino,
//         //     },
//         //   },
//         // };
//         // console.log(parseJSon);
//
//       }

//       // if (line.match(regex2)) line_sel = 1;
//       // if (line.match(regex3)) line_sel = 1;
//       // if (line.match(regex4)) line_sel = 1;
//       // if (line.match(regex5)) line_sel = 1;
//       // if (line.match(regex6)) line_sel = 1;
//       // if (line.match(regex7)) line_sel = 1;
//       // if (line.match(regex8)) line_sel = 1;
//       // if (line.match(regex9)) line_sel = 1;
//       // if (line.match(regex10)) line_sel = 1;

//       // if (line.trim() === '') line_sel = 2;
//       // if (line_sel === 0) console.log(`linha ori: ${line}`);
//       // console.log(`linha sel : ${line}`);
//     });

//     // let lines = data.text.split('\n');
//     // for (var i = 0; i < lines.length; i++) {
//     //   console.log(`linha ${i} - text: ${lines[i]}`);
//     // }

//     // Total page
//     console.log('Total pages: ', data.numpages);

//     // File information
//     console.log('Info: ', data.info.Title);
//     console.log('Author: ', data.info.Author);

//     return data;
//   }
// }

// function withregex() {
//   // alterando e substituindo textos
//   const regex = /word\b/g;
//   const str = `word boundaries are odd`;
//   const substr = `teste`;
//   const result = str.replace(regex, substr);
//   console.log('Substitution result: ', result);
