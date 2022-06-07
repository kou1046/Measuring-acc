import { useEffect, useState, useRef } from "react";
import { CSVLink } from "react-csv";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js'
import { dft } from './common_function';

Chart.register(...registerables)

export const App = () => {
    const isTouch = useRef(false);
    const isActive = useRef(false);
    const startTime = useRef(0);
    const curAcc = useRef({
        t: [],
        x: [],
        y: [],
        z: [],
    });
    const [isArrow, setIsArrow] = useState(false);
    const [measurementTime, setMeasurementTime] = useState(0);
    const [resultAcc, setResultAcc] = useState(null);

    const getAcceleration = (event) => {
        if (isTouch.current) {
            if (!isActive.current) {
                startTime.current = Date.now();
                isActive.current = true;
                return
            }
            const { x: newX, y: newY, z: newZ } = event.acceleration;
            const { t, x, y, z } = curAcc.current
            const newT = (Date.now() - startTime.current) / 1000;
            curAcc.current = { t: [...t, newT], x: [...x, newX], y: [...y, newY], z: [...z, newZ] };
        } else {
            if (isActive.current) {
                setResultAcc(curAcc.current);
                setMeasurementTime((Date.now() - startTime.current) / 1000);
                curAcc.current = { t: [], x: [], y: [], z: [] };
                isActive.current = false;
            }
        }
    }

    const getGyro = (event) => {

    }

    const checkDialog = () => {
        if (navigator.userAgent.match('iPhone|iPad')) {
            window.DeviceMotionEvent.requestPermission().then((res) => {
                if (res === 'granted') {
                    window.addEventListener('devicemotion', getAcceleration);
                    window.addEventListener('deviceorientation', getGyro);
                    setIsArrow(true);
                } else {
                    alert('ブラウザを再起動してセンサー利用の許可をして下さい！');
                    return
                }
            })
        } else {
            setIsArrow(true);
        }

    }

    const renderCsvBtn = () => {
        const { t, x, y, z } = resultAcc
        const data = [
            ['time', 'x_acc', 'y_acc', 'z_acc'],
            ...resultAcc.x.map((el, i) => {
                return [t[i], x[i], y[i], z[i]]
            })
        ];
        return <CSVLink filename='Acceleration_data.csv' data={data}>Download CSV</CSVLink>
    }

    const renderChart = () => {
        const N = resultAcc.t.length;
        const dt = resultAcc.t[1] - resultAcc.t[0];
        const x = dft(resultAcc.x);
        const y = dft(resultAcc.y);
        const z = dft(resultAcc.z);
        const dftData = {
            freq: [...Array(N)].map((_, i) => (i * (1 / dt) / N).toFixed(2)).slice(0, Math.floor(N / 2) + 1),
            x: x.Re.map((_, index) => Math.sqrt(x.Re[index] ** 2 + x.Im[index] ** 2) / N * 2).slice(0, Math.floor(N / 2) + 1),
            y: y.Re.map((_, index) => Math.sqrt(y.Re[index] ** 2 + y.Im[index] ** 2) / N * 2).slice(0, Math.floor(N / 2) + 1),
            z: z.Re.map((_, index) => Math.sqrt(z.Re[index] ** 2 + z.Im[index] ** 2) / N * 2).slice(0, Math.floor(N / 2) + 1),
        }
        const target = dftData.z;
        const maxAmpIndex = target.indexOf(target.reduce((prev, cur) => Math.max(prev, cur)));
        const peakFreq = dftData.freq[maxAmpIndex];

        const data = {
            labels: resultAcc.t,
            datasets: [
                {
                    label: 'x',
                    data: resultAcc.x,
                    borderColor: 'green'
                },
                {
                    label: 'y',
                    data: resultAcc.y,
                    borderColor: 'red'
                },
                {
                    label: 'z',
                    data: resultAcc.z,
                    borderColor: 'black'

                }
            ],
        }
        const data2 = {
            labels: dftData.freq,
            datasets: [
                {
                    label: 'x',
                    data: dftData.x,
                    borderColor: 'green'
                },
                {
                    label: 'y',
                    data: dftData.y,
                    borderColor: 'red'
                },
                {
                    label: 'z',
                    data: dftData.z,
                    borderColor: 'black'
                },
            ]
        }

        const baseOptions = {
            elements: {
                point: {
                    radius: 0
                },
            },
        }

        const options1 = {
            ...baseOptions, ...{
                plugins: {
                    title: {
                        display: true,
                        text: 'Acceleration'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Times [s]',
                            color:'black'

                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Acceleration [m/s^2]',
                            color:'black'
                        }
                    }
                }
            }
        }

        const options2 = {
            ...baseOptions, ...{
                plugins: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                scales: {
                    x: {

                        title: {
                            display: true,
                            text: 'Frequency [Hz]',
                            color:'black'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amplitude',
                            color:'black'
                        }
                    }
                }
            }
        }

        return (
            <div>
                <div style={{ border: 'solid 1px' }}>
                    <Line data={data} options={options1}/>
                </div>
                <div style={{ border: 'solid 1px', marginTop: '1em' }}>
                    <Line data={data2} options={options2} />
                </div>
                <p>ピーク周波数 {peakFreq}</p>
                <p>ピーク周期 {1 / peakFreq}</p>
            </div>
        )
    }

    const buttonStyle = {
        width: 300,
        height: 300,
        fontSize: 30
    }

    if (!DeviceOrientationEvent.requestPermission && !navigator.userAgent.match('Android.+Mobile')) {
        return (
            <>  
                <p>pcでは利用できません</p>
            </>
        )
    }

    if (!isArrow) {
        return (
            <button onClick={checkDialog}>センサーの有効化</button>
        )
    }

    return (
        <>
            <div style={{ textAlign: 'center', marginTop: 100 }}>
                <p><button style={buttonStyle}
                    onTouchEnd={() => isTouch.current = false}
                    onTouchStart={() => isTouch.current = true}>
                    長押しで計測</button></p>
                {resultAcc ? renderChart() : null}
                <p>計測時間 : {measurementTime} [sec]</p>
                <p>{resultAcc ? renderCsvBtn() : null}</p>
            </div>
        </>
    )
}