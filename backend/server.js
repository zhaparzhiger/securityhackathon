// server.js
const dotenv = require('dotenv');
const authenticateBot = require('./botAuthentication'); // Аутентификация бота с помощоью JWT
dotenv.config()
const {generate} = require('../hui/scrapper')
const { exec } = require('child_process');
const express = require('express');
const axios = require('axios');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Vulnerability } = require('./db');
const { ScanResult } = require('./db');
const cors = require('cors');
const {parseExploitData} = require('./scrapper')
const globalLength =[]
const {sequelize} = require('./db');
const app = express();
app.use(express.json())
const SECRET_KEY = "your-secret-key"; 
/**
 * Swagger setup
 */
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Vulnerability Scanner API',
      version: '1.0.0',
      description: 'API documentation for the vulnerability scanner project',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local server',
      },
    ],
  },
  apis: [__filename],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(cors());
/**
 * @swagger
 * components:
 *   schemas:
 *     ScanRequest:
 *       type: object
 *       properties:
 *         targets:
 *           type: array
 *           items:
 *             type: string
 *           description: List of target IPs or domains to scan.
 *       required:
 *         - targets
 *
 *     ScanResult:
 *       type: object
 *       properties:
 *         host:
 *           type: string
 *         service:
 *           type: string
 *         exploit:
 *           type: string
 *         status:
 *           type: string
 *         statusDesc:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/scan:
 *   post:
 *     summary: Perform a scan on specified targets.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScanRequest'
 *     responses:
 *       200:
 *         description: Scan completed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 scanResults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScanResult'
 *       400:
 *         description: Bad request. At least one target IP or domain is required.
 *       500:
 *         description: Scan failed due to an internal error.
 */
app.post('/api/v1/scan', async (req, res) => {
  const { targets } = req.body; 

  if (!targets || !Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({ error: "At least one target IP or domain is required" });
  }

  try {
    const vulnerabilities = await Vulnerability.findAll({
      limit: 10,
      attributes: ['title', 'description']
    });

    const scanResults = await Promise.all(targets.map(target => scanHost(target)));
    const prompt = generate(scanResults, vulnerabilities);

    const chatGptResponse = await getChatGPTResponse(prompt);
    
    processAPIResponse(chatGptResponse, scanResults);

    res.status(200).json({ message: "Scan completed successfully", scanResults });
  } catch (error) {
    console.error("Scan error:", error);
    res.status(500).json({ error: "Scan failed" });
  }
});
/**
 * @swagger
 * /api/v1/titles:
 *   get:
 *     summary: Retrieve a list of vulnerabilities.
 *     responses:
 *       200:
 *         description: A list of vulnerabilities.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *       500:
 *         description: Error while fetching vulnerabilities.
 */
app.get('/api/v1/titles', async (req, res) => {
  try {
    const vulnerabilities = await Vulnerability.findAll({
      limit: 10,  
      attributes: ['title', 'description']  
    });
    res.json(vulnerabilities);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении уязвимостей' });
  }
});
/**
 * @swagger
 * /api/v1/vulnerabilities:
 *   get:
 *     summary: Retrieve scan results.
 *     responses:
 *       200:
 *         description: A list of scan results.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ScanResult'
 *       500:
 *         description: Error while fetching scan results.
 */
app.get('/api/v1/vulnerabilities', async (req, res) => {
  try {
    const vulnerabilities = await ScanResult.findAll({
      limit: globalLength.length,  
      attributes: ['host', 'service', 'exploit', 'status', 'statusDesc', 'createdAt', 'updatedAt'],  
      order: [['createdAt', 'DESC']] 
    });
    res.json(vulnerabilities);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении уязвимостей' });
  }
});

function scanHost(host) {
  return new Promise((resolve, reject) => {
    exec(`"C:/Program Files (x86)/Nmap/nmap.exe" -sV ${host}`, (err, stdout, stderr) => {
      if (err) {
        reject(`Ошибка при выполнении команды: ${err.message}`);
        return;
      }
      if (stderr) {
        reject(`Ошибка: ${stderr}`);
        return;
      }

      const scanResults = stdout;
      
      const openPorts = processScanResults(scanResults);
      
      resolve({ host, openPorts });
    });
  });
}

function processScanResults(results) {
  const openPorts = [];
  const regex = /(\d+)\/tcp\s+open\s+(\S+)\s+([^\r\n]+)/g;
  let match;

  while ((match = regex.exec(results)) !== null) {
    const versionMatch = match[3].trim();
    const version = versionMatch.includes('nginx') && versionMatch.split(' ')[1]
      ? `${versionMatch.split(' ')[0]} ${versionMatch.split(' ')[1]}`
      : versionMatch;

    openPorts.push({
      port: match[1],
      service: match[2],
      version: version
    });
  }

  return openPorts;
}

const apiKey = process.env.OPENAI_API_KEY;

async function getChatGPTResponse(prompt) {
  try {
    const url = "https://api.openai.com/v1/chat/completions";

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };

    const data = {
        model: "gpt-3.5-turbo-0125",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
        ],
    };

    const response = await axios.post(url, data, { headers });
    console.log('API Response:', response);

    if (response.data && response.data.choices && response.data.choices[0].message) {
      const message = response.data.choices[0].message.content; 
      return response;
    } else {
      throw new Error('Invalid response format: "message" not found.');
    }
    
    } catch (error) {
      console.error('Error calling ChatGPT API:', error.message);
      if (error.response) {
        console.error('Response Error:', error.response.data);
        console.error('Response Status:', error.response.status);
      } else if (error.request) {
        console.error('Request Error:', error.request);
      }
      return 'An error occurred while processing the request';
  }
}

function processAPIResponse(response, scanResults) {
  console.log("API Response:", response);

  if (response && response.data && response.data.choices && response.data.choices.length > 0) {
    const resultsText = response.data.choices[0].message.content.trim();

    const processedServices = new Set(); 

    scanResults.forEach(result => {
      const service = result.openPorts[0]?.version || "Unknown Service"; 
      const port = result.openPorts[0]?.port || "Unknown Port"; 
      const serviceKey = `${service} ${port}`; 

      if (alreadyProcessed(serviceKey, processedServices)) return;

      processedServices.add(serviceKey);

      const scanStatus = getScanStatus(resultsText);
      const exploit = extractExploitFromResponse(resultsText);

      const statusDesc = extractStatusDesc(resultsText);
      saveScanResult({
        scan_id: result.host,
        service: service,
        exploit: exploit,
        status: scanStatus,
        statusDesc: statusDesc,
      });
    });
  } else {
    console.error("Error: 'choices' is missing or empty in the API response.");
  }
}
function getScanStatus(resultsText) {
  return resultsText.includes('Уязвим') ? 'vulnerable' : 'not_vulnerable';
}

  function extractExploitFromResponse(responseText) {
    const regex = /Выбранный эксплойт: (.*?)\n/i;
    const match = responseText.match(regex);
    return match ? match[1].trim() : 'No exploit found';
  }
  function extractStatusDesc(responseText) {
    const regex = /Статус уязвимости: (.*?)\n/i;
    const match = responseText.match(regex);
    return match ? match[1].trim() : 'Описание отсутствует';
  }
    // Execute the regex on the response text to find a match
  
    
    // Return the extracted exploit if found, otherwise return a default message
function alreadyProcessed(serviceKey, processedServices) {
  return processedServices.has(serviceKey);
}



async function saveScanResult(result) {
  try {
    console.log(result);
globalLength.push(result)
    const existingResult = await ScanResult.findOne({
      where: {
        host: result.scan_id,
        service: result.service,
        exploit: result.exploit,
        status: result.status,
        statusDesc: result.statusDesc
      }
    });

      const newResult = {
        host: result.scan_id,
        service: result.service,
        exploit: result.exploit,
        status: result.status,
        statusDesc: result.statusDesc
      };

      await ScanResult.create(newResult);
      console.log(`Scan result for ${result.scan_id} saved.`);
  } catch (error) {
    console.error('Error saving scan result:', error);
  }
}



  const start = async() =>{
      try {
  const count = await Vulnerability.count();

  if (count === 0) {
      console.log('База данных пуста, начинаем парсинг данных...');
      await parseExploitData();
  } else {
      console.log('Записи уже есть в базе данных, пропускаем парсинг,следующий парсинг через 24 часа.');
 }          await sequelize.authenticate();
 await sequelize.sync(); 
 app.listen(4000,() => {
              console.log(`Server started at port 4000`)
          })
      } catch (error) {
          console.error('Failed to start server:', error);
      }
  }
  start()
