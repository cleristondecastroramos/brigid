const fs = require("fs");
let content = fs.readFileSync("src/routes/manual.tsx", "utf8");

const newSection = `          {/* 2. Origem do nome BRÍGID */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">2. Origem do nome BRÍGID</h2>
            <p className="leading-relaxed text-justify">O nome BRÍGID foi escolhido como referência simbólica a Santa Brígida da Irlanda (também conhecida como Brigid of Kildare), figura histórica e religiosa do século V associada à proteção, à compaixão, à liderança comunitária e ao cuidado com pessoas em situação de vulnerabilidade. Brígida é reconhecida como uma das três padroeiras da Irlanda e foi fundadora de uma importante comunidade monástica em Kildare, que se tornou centro de acolhimento, organização social, espiritualidade e formação.</p>
            <p className="leading-relaxed text-justify">Na tradição histórica e cultural, Brígida passou a ser lembrada por valores como caridade, proteção, cura, hospitalidade, justiça social e amparo aos mais frágeis, atributos que dialogam diretamente com a missão institucional do sistema. Em diferentes relatos sobre sua trajetória, ela aparece como uma liderança feminina de grande relevância, ligada à assistência aos necessitados, à organização de comunidades e à defesa concreta da dignidade humana.</p>
            <p className="leading-relaxed text-justify">A escolha desse nome para o sistema BRÍGID está vinculada ao propósito central do projeto: monitorar, organizar e qualificar a resposta institucional à violência de gênero, fortalecendo a rede de proteção à mulher nos municípios piauienses. Assim como Brígida é tradicionalmente associada à proteção e ao cuidado, o sistema foi concebido para apoiar o Ministério Público na identificação de vulnerabilidades territoriais, no acompanhamento da infraestrutura de atendimento e na priorização de ações voltadas à prevenção do feminicídio e à defesa das mulheres em situação de risco.</p>
            <p className="leading-relaxed text-justify">Nesse sentido, o nome BRÍGID cumpre dupla função: ele oferece uma identidade forte, feminina e institucional para a plataforma, e ao mesmo tempo traduz, em chave simbólica, os valores que orientam o projeto — proteção, vigilância, acolhimento, inteligência territorial e atuação preventiva. O sistema não utiliza esse nome apenas como homenagem histórica, mas como expressão de uma lógica de trabalho comprometida com cuidado qualificado, leitura estratégica do território e fortalecimento da resposta pública diante da violência contra a mulher.</p>
          </section>
`;

for (let i = 15; i >= 2; i--) {
  // Replace HTML comments e.g. {/* 15. ... */}
  let target = new RegExp("(\\{/\\* )" + i + "(\\. )", "g");
  content = content.replace(target, "$1" + (i + 1) + "$2");

  // Replace <h2> tags e.g. <h2 className="...">15. ...</h2>
  target = new RegExp('(">)' + i + "(\\. )", "g");
  content = content.replace(target, "$1" + (i + 1) + "$2");

  // Replace <h3> tags e.g. <h3 className="...">15.1. ...</h3>
  target = new RegExp('(">)' + i + "(\\.\\d+\\. )", "g");
  content = content.replace(target, "$1" + (i + 1) + "$2");
}

// Insert new section after section 1
const insertPoint = content.indexOf("{/* 3. Finalidade do sistema */}");
content = content.slice(0, insertPoint) + newSection + "\n" + content.slice(insertPoint);

fs.writeFileSync("src/routes/manual.tsx", content);
console.log("Updated manual.tsx successfully");
