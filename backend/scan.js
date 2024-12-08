const { exec } = require('child_process');

function scanHost(host) {
    // Указываем полный путь к nmap
    exec(`"C:/Program Files (x86)/Nmap/nmap.exe" -sV ${host}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Ошибка при выполнении команды: ${err.message}`);
            return;
        }
        if (stderr) {
            console.error(`Ошибка: ${stderr}`);
            return;
        }

        // Сохраняем результаты сканирования в переменную
        const scanResults = stdout;

        // Выводим результаты на консоль
        console.log(`Результаты сканирования для ${host}:\n${scanResults}`);

        // Теперь вы можете использовать переменную scanResults для других действий
        processScanResults(scanResults);
    });
}

function processScanResults(results) {
    // Пример обработки результатов (например, поиск открытых портов и версий)
    const openPorts = [];
    // Обновленное регулярное выражение для правильного захвата версии после сервиса
    const regex = /(\d+)\/tcp\s+open\s+(\S+)\s+([^\r\n]+)/g;
    let match;
    
    while ((match = regex.exec(results)) !== null) {
        // Захватываем номер порта, имя сервиса и версию
        const versionMatch = match[3].trim();
        const version = versionMatch.includes('nginx') && versionMatch.split(' ')[1] 
                        ? `${versionMatch.split(' ')[0]} ${versionMatch.split(' ')[1]}` 
                        : versionMatch;

        openPorts.push({ 
            port: match[1], 
            service: match[2], 
            version: version  // Добавляем корректную версию
        });
    }

    console.log("Открытые порты и версии:", openPorts);
}

scanHost('tou.edu.kz'); // Пример с вашим хостом
