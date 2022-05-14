import { useEffect, useState ,useRef} from "react";
import { CSVLink } from "react-csv";
import { Line } from "react-chartjs-2";
import { Chart,registerables } from 'chart.js'

Chart.register(...registerables)

export const App = () => {
    const isTouch = useRef(false);
    const isActive = useRef(false);
    const startTime = useRef(0);
    const curAcc = useRef({
        t : [],
        x : [],
        y : [],
        z : [],
    });
    const [isArrow,setIsArrow] = useState(false);
    const [measurementTime,setMeasurementTime] = useState(0);
    const [resultAcc,setResultAcc] = useState(null);

    const getAcceleration = (event) => {
        if (isTouch.current){
            if (!isActive.current){
                startTime.current = Date.now();
                isActive.current = true;
                return 
            }
            const {x:newX,y:newY,z:newZ} = event.acceleration;
            const {t,x,y,z} = curAcc.current
            const newT = (Date.now() - startTime.current) / 1000;
            curAcc.current = {t:[...t,newT],x:[...x,newX],y:[...y,newY],z:[...z,newZ]};
        }else{
            if (isActive.current){
                setResultAcc(curAcc.current);
                setMeasurementTime( (Date.now() - startTime.current) / 1000);
                curAcc.current = {t:[],x:[],y:[],z:[]};
                isActive.current = false;
            }
        }
    }

    const getGyro = (event) => {

    }

    const checkDialog = () => {
        if(navigator.userAgent.match('iPhone|iPad')){
        window.DeviceMotionEvent.requestPermission().then((res) => {
            if (res === 'granted') {
                window.addEventListener('devicemotion',getAcceleration);
                window.addEventListener('deviceorientation',getGyro);
                setIsArrow(true);
            } else {
                alert('ブラウザを再起動してセンサー利用の許可をして下さい！');
                return 
            }
        })
    }else{
        setIsArrow(true);
    }
        
    }

    const renderCsvBtn = () => {
        const {t,x,y,z} = resultAcc
        const data = [
            ['time','x_acc','y_acc','z_acc'],
            ...resultAcc.x.map((el,i) => {
                return [t[i],x[i],y[i],z[i]]
            })
        ];
        return <CSVLink filename='Acceleration_data.csv' data={data}>Download CSV</CSVLink>
    }

    const renderChart = () => {
        const data = {
            labels: resultAcc.t,
            datasets: [
              {
               label:'x',
               data:resultAcc.x,
               borderColor:'green'
              },
              {
                label:'y',
                data:resultAcc.y,
                borderColor:'red'
              },
              {
                  label:'z',
                  data:resultAcc.z,
                  borderColor:'black'

              } 
            ],
        }

        return (
            <div>
              <Line data={data} />
            </div>
        )
}

    const buttonStyle = {
        width:300,
        height:300,
        fontSize:30
    }

    if (!DeviceOrientationEvent.requestPermission && !navigator.userAgent.match('Android.+Mobile')){
        return <p>pcでは利用できません</p>
    }

    if (!isArrow){
        return (
        <button onClick={checkDialog}>センサーの有効化</button>
        )
    }

    return (
        <>
            <div style={{textAlign:'center',marginTop:100}}>
                <p><button style={buttonStyle} 
                           onTouchEnd={() => isTouch.current=false} 
                           onTouchStart={() => isTouch.current=true}>
                            長押しで計測</button></p>
                {resultAcc ? renderChart() : null}
                <p>計測時間 : {measurementTime} [sec]</p>
                <p>{resultAcc ? renderCsvBtn() : null}</p>
            </div>
        </>
    )
}