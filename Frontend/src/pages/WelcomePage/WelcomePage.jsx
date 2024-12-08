import React from 'react'
import { Link } from 'react-router-dom'
import styles from "./styles/WelcomePage.module.css"

function WelcomePage() {
  return (
    <div className={styles.welcome__page}>
        <div className={`${styles.welcome__page__container} _container`}>
            <div className={styles.welcome__page__block}>
                <div className={`${styles.welcome__page__text__block} ${styles.text__block}`}>
                    <div className={styles.text__block__one}>WEB PLATFORM FOR CHECKING</div>
                    <div className={styles.text__block__two}>WEBSITES ON</div>
                    <div className={styles.text__block__three}>VULNERABILITIES</div>
                </div>
                <Link to={"/main"} className={`${styles.welcome__page__button__block} ${styles.button__block}`}>
                    <button className={styles.button__block__btn}>Start NOW</button>
                </Link>
            </div>
        </div>
    </div>
  )
}

export default WelcomePage
