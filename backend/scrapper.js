const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const url = 'https://sploitus.com/?query=exploit#exploits';
const { sequelize, Vulnerability } = require('./db');

const linksGet = async (page) => {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector(".accordion");

    console.log("Раскрываем первые 10 аккордеонов...");
    await page.evaluate(() => {
        const accordions = document.querySelectorAll('.accordion input[type="checkbox"]');
        for (let i = 0; i < Math.min(10, accordions.length); i++) {
            if (!accordions[i].checked) {
                accordions[i].click();
            }
        }
    });

    const buttons = await page.$$('.btn[data-action="origin"]');
    const limitedButtons = buttons.slice(0, 10); 
    const results = [];

    for (let button of limitedButtons) {
        try {
            await button.click();

            const [popup] = await Promise.all([
                new Promise((resolve) => page.once("popup", resolve)),
            ]);

            await popup.waitForNavigation({ waitUntil: "networkidle2" });
            const popupUrl = popup.url();

            const firstParagraphText = await popup.evaluate(() => {
                const paragraph = document.querySelector(".markdown-heading + p");
                return paragraph ? paragraph.textContent.trim() : null;
            });

            results.push({
                link: popupUrl,
                description: firstParagraphText || "Описание отсутствует",
            });

            await popup.close();
        } catch (error) {
            console.warn("Ошибка обработки ссылки:", error.message);
        }
    }

    return results;
};
function generate(scanResults, vulnerabilities) {
    let prompt = `На основе следующего сканирования и списка уязвимостей, симулируйте применение эксплойта для каждого сервиса,как будто вы его использовали и нашли уявзимости,рандомно подбери эксплоиты(1 или 2 с описанием корректным) и потом выдуманно примени их, и определите результат: уязвим или нет. Укажите название эксплойта, который был применен, и статус уязвимости(структурированно и коротко).\n\n`;
  prompt+=`следуй данной структуре всегда: 1. Для сервиса nginx 1.16.1 на порту 80:
     - Выбранный эксплойт: Exploit for CVE-2024-4367
     - Результат: Уязвим
     - Статус уязвимости: Воздействует, так как уязвимость предоставляет возможность для произвольного выполнения JavaScript в контексте PDF.js.\n`
    prompt += `Результаты сканирования:\n`;
    scanResults.forEach(result => {
      prompt += `Хост: ${result.host}\n`;
      result.openPorts.forEach(port => {
        prompt += `  Открытый порт: ${port.port}, Сервис: ${port.version}\n`;
      });
    });
  
    prompt += `\nСписок уязвимостей (с эксплойтами):\n`;
    vulnerabilities.forEach(vul => {
      prompt += `Название уязвимости: ${vul.title}, Описание: ${vul.description}\n`;
    });
  
  
    return prompt;
  }
async function parseExploitData() {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
        );

        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".panel");

        const content = await page.content();
        fs.writeFileSync("page.html", content);

        console.log('HTML сохранен в "page.html"');
        console.log("Парсинг начался");

        const $ = cheerio.load(content);
        const vulnerabilities = [];

        $(".panel").slice(0, 10).each((index, element) => {
            const title = $(element).find(".accordion-header.text-large.text-bold").text().trim();
            const date = $(element).find(".tile-subtitle.text-gray").text().trim();
            const sourceId = $(element).find('.btn[data-action="origin"]').attr("data-id");
            const sourceUrl = `https://github.com/${sourceId}`;

            vulnerabilities.push({
                id: sourceId,
                title,
                links: [],
                description: [],
                date: new Date(date),
                sourceUrl,
                exploits: []
            });
        });
        const linksDescriptions = await linksGet(page);
        vulnerabilities.forEach((vuln, index) => {
            if (linksDescriptions[index]) {
                const linkWithGit = `${linksDescriptions[index].link}.git`;
                vuln.links.push(linksDescriptions[index].link);
                vuln.exploits.push(linkWithGit);
                vuln.description.push(linksDescriptions[index].description);
            }
        });

        vulnerabilities.sort((a, b) => b.date - a.date);
        const latestVulnerabilities = vulnerabilities.slice(0, 10);

        console.log("Топ 10 новейших уязвимостей:", latestVulnerabilities);

        await sequelize.sync(); 

        for (const vuln of latestVulnerabilities) {
            await Vulnerability.create({
                id: vuln.id,
                title: vuln.title,
                description: vuln.description.join('\n'),                date: vuln.date,
                sourceUrl: vuln.links.join('\n'),
                exploits:vuln.exploits.join('\n'),
            });
        }

        console.log("Данные успешно сохранены в базу данных.");
    } catch (error) {
        console.error("Ошибка при парсинге:", error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { parseExploitData,generate };
