import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import MyModal from "../../components/MyModal/MyModal";
import styles from "./styles/MainPage.module.css";
import virus from "../../../images/virus.svg";
import computer from "../../../images/computer.svg";
import Loader from "../../components/Loader/Loader";
import HistoryPage from "./HistoryPage/HistoryPage";

function MainPage() {
  const [input, setInput] = useState("");
  const [data, setData] = useState("");
  const [scannedFormattedData, setScannedFormattedData] = useState([]);
  const [scannedData, setScannedData] = useState([]);
  const [typedText, setTypedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem("scanHistory");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
    let text;

  const [exploits, setExploits] = useState([]);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("http://localhost:4000/api/v1/titles");
        setExploits(response.data);
      } catch (error) {
        console.error(error);
        return;
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchScannedData() {
      try {
        const response = await axios.get("http://localhost:4000/api/v1/vulnerabilities");

        const formattedText = await response.data.map((result) => {
          return `Хост: ${result.host}
Сервис: ${result.service}
Эксплойт: ${result.exploit}
Статус: ${result.status}
Описание: ${result.statusDesc}`;
        });

        setScannedData(response.data);
        setScannedFormattedData(formattedText);
      } catch (error) {
        console.error(error);
        return;
      }
    }

    fetchScannedData();
  }, [typedText, text]);

  
  const handleStartPortScanClick = async () => {
    setLoading(true);
    try {
      // Разделение введенных данных на массив URL/IP
      const targets = input.split(/\n|,|\s+/).filter((item) => item.trim() !== "");

      const response = await axios.post("http://localhost:4000/api/v1/scan", {
        targets,
      });

      console.log(response);
      setData(response.data);
       // Сохранение запроса в истории
    const newHistoryItem = {
      type: "Scan",
      url: targets.join(", "),
      status: response.status === 200 ? "Success" : "Failed",
    };

    setHistory((prevHistory) => [...prevHistory, newHistoryItem]);
    } catch (error) {
      setLoading(false);
      console.error(error);
      const failedHistoryItem = {
        type: "Scan",
        url: input,
        status: "Failed",
      };
  
      setHistory((prevHistory) => [...prevHistory, failedHistoryItem]);
  
      return;
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const savedHistory = localStorage.getItem("scanHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);
  
  
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("scanHistory", JSON.stringify(history));
    }
  }, [history]);
  
  
  text = data?.scanResults?.map((result) => {
    const host = result.host;
    const portsInfo = result.openPorts
      .map((port) => {
        return `Port: ${port.port}\nService: ${port.service}\nVersion: ${port.version}\n`;
      })
      .join("\n");
    return `Host: ${host}\n${portsInfo}`;
  }).join("\n\n");
  let position = 0;

  const typeText = useCallback(() => {
    if (position === text?.length) return;
    let nextChar = text[position];
    if (nextChar !== undefined) {
      setTypedText((prev) => prev + nextChar);
    }
    position++;
    setTimeout(typeText, randomInt());
  }, [position, text]);

  function randomInt(min = 1, max = 100) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }
  const clearHistory = () => {
    // Очистка данных в localStorage
    localStorage.removeItem("scanHistory");
    // Сброс состояния истории
    setHistory([]);
  };
  
  useEffect(() => {
    if (text?.length > 0) {
      setTypedText("");
      typeText();
    }
  }, [text, typeText]);

  useEffect(() => {
    setLoading(true);
    try {
      if (typedText && typedText.length > 0) {
        const timer = setTimeout(() => {
          setTypedText(scannedFormattedData);
        }, 15000);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      return;
    } finally {
      setLoading(false);
    }
  }, [typedText, scannedData]);
 // Timer functionality
 useEffect(() => {
  const savedStartTime = localStorage.getItem("timerStartTime");
  const currentTime = Date.now();

  // If there's no saved start time, set the timer to start now
  if (!savedStartTime) {
    const newStartTime = currentTime;
    localStorage.setItem("timerStartTime", newStartTime);
  }

  const timerInterval = setInterval(() => {
    const savedStartTime = parseInt(localStorage.getItem("timerStartTime"), 10);
    const elapsedTime = currentTime - savedStartTime;
    const remaining = Math.max(0, 86400000 - elapsedTime); // 86400000 ms = 24 hours

    setRemainingTime(remaining);
  }, 1000); // Update every second

  return () => clearInterval(timerInterval); // Cleanup on unmount
}, [remainingTime]);

// Convert remaining time to a readable format (HH:MM:SS)
const formatTime = (ms) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
  return (
    <>
    <HistoryPage
  visible={historyVisible}
  setVisible={setHistoryVisible}
  history={history}
  clearHistory={clearHistory}
/>

      <div className={styles.main}>
        <div className={`${styles.main_container} _container`}>
          <div className={styles.content}>
            <div className={styles.title}>
              SCAN <span>YO</span>UR WEBSITE
            </div>
            <div className={styles.gadget}>
              <div className={styles.gadget_content}>
                <div className={styles.first_line}>
                  <div className={styles.lights}>
                    <div className={styles.light1}></div>
                    <div className={styles.light2}></div>
                  </div>
                  <div className={styles.circle}>
                    <div className={styles.switcher} />
                  </div>
                </div>
                <div className={styles.second_line}>
                  <div className={styles.title2}>Type your links or IPs here (one per line)</div>
                  <textarea
                    value={input}
                    onChange={(event) => handleInputChange(event)}
                    className={styles.input}
                    placeholder="Enter URLs or IPs, one per line"
                  />
                  {loading ? (
                    <Loader />
                  ) : (
                    <textarea
                      readOnly
                      className={styles.display}
                      value={typedText}
                    ></textarea>
                  )}
                  <button
                    onClick={() => handleStartPortScanClick()}
                    className={styles.scan}
                  >
                    Start
                  </button>
                </div>
                <div className={styles.third_line}>
                  <div className={styles.circle}>
                    <div className={styles.switcher} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.last__scan__block}>
              <ul className={styles.last__scan__block__text}>
                <div className={styles.last__scan__block__text__title}>
                  Результаты последнего сканирования:
                </div>
                {scannedData.map((data, index) => (
                  <>
                    <li key={index} className={styles.last__scan__block__text__item}>
                      <span>Хост:</span> {data.host}
                    </li>
                    <li key={index} className={styles.last__scan__block__text__item}>
                      <span>Сервис:</span> {data.service}
                    </li>
                    <li key={index} className={styles.last__scan__block__text__item}>
                      <span>Эксплойт:</span> {data.exploit}
                    </li>
                    <li key={index} className={styles.last__scan__block__text__item}>
                      <span>Статус:</span> {data.status}
                    </li>
                    <li key={index} className={styles.last__scan__block__text__item}>
                      <span >Описание:</span> {data.statusDesc}
                    </li>
                    <br />
                  </>
                ))}
              </ul>
            </div>

            <div className={styles.titles__block}>
              <div className={styles.titles__block__title}>
                Эксплойты на сегодня:
                <div className={styles.timer}>
                    До следующего парсинга осталось: {formatTime(remainingTime)}
                  </div>
              </div>
              <ul className={styles.title__block__text}>
                {exploits.map((exploit, index) => (
                  <li key={index} className={styles.title__block__text__item}>
                    {index + 1}. {exploit.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MainPage;
