import React from 'react'
import styles from './styles/Loader.module.css'

function Loader() {
  return (
    <div className={styles.loader__block}>
        <div className={styles.loader}></div>
        <div className={styles.loader__text}>
          <span className={styles.text}>Bot scanning,checking token...</span>
          <span className={styles.dot__one}>.</span>
          <span className={styles.dot__two}>.</span>
          <span className={styles.dot__three}>.</span>
        </div>
    </div>
  )
}

export default Loader
