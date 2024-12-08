import React from 'react';
import cl from './styles/MyModal.module.css'

const MyModal = ({children, visible, setVisible}) => {  // Сам компонент MyModal не может регулировать видимость или невидимость, этим будет управлять родительский компонент в котором модалка используется

    const rootClasses = [cl.myModal]

    if (visible) {
        rootClasses.push(cl.active)
    }
    // С помощью этой коснтрукции мы определяем добавлять класс active или нет



    return (
        <div className={rootClasses.join(' ')} onClick={() => setVisible(false)}>
            <div className={cl.myModalContent} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    )

// e.stopPropagation предотвращает неправильное поведение того что когда мы нажимаем на контентную часть, то у нас закрывается модалка
}

export default MyModal;