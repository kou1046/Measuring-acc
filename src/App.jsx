import { useState, useRef } from "react";
import { CSVLink } from "react-csv";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js'
import { dft } from './common_function';
import { Button, Tabs, Box, Tab, Dialog, TextField } from '@mui/material'

Chart.register(...registerables)

export const App = () => {
    const isActive = useRef(false);
    const isRecording = useRef(false);
    const startTime = useRef(0);
    const curAcc = useRef({
        t: [0],
        x: [0],
        y: [0],
        z: [0],
    });
    const limitLength = useRef(0);
    const customInputRef = useRef(null);
    const [activeDialog, setActiveDialog] = useState(false);
    const [customTimeDialog, setCustomTimeDialog] = useState(false);
    const [customLengthDialog, setCustomLengthDialog] = useState(false);
    const [isArrow, setIsArrow] = useState(false);
    const [measurementTime, setMeasurementTime] = useState(0);
    const [optionValue, setOptionValue] = useState(0);
    const [resultAcc, setResultAcc] = useState(null);

    const getAcceleration = (event) => {
        if (isActive.current) {
            if (!isRecording.current) {
                startTime.current = Date.now();
                isRecording.current = true;
                return
            }
            const { x: newX, y: newY, z: newZ } = event.acceleration;
            const { t, x, y, z } = curAcc.current
            const newT = (Date.now() - startTime.current) / 1000;
            curAcc.current = { t: [...t, newT], x: [...x, newX], y: [...y, newY], z: [...z, newZ] };
            if (curAcc.current.t.length === limitLength.current) {
                isActive.current = false
            }
        } else {
            if (isRecording.current) {
                setResultAcc(curAcc.current);
                setMeasurementTime((Date.now() - startTime.current) / 1000);
                setActiveDialog(false);
                setCustomTimeDialog(false);
                setCustomLengthDialog(false);
                curAcc.current = { t: [0], x: [0], y: [0], z: [0] };
                limitLength.current = 0;
                isRecording.current = false;
            }
        }
    }

    const activeSpecificTime = (sec) => {
        if (sec < 0.05){
            alert('適切な数値を入力してください！')
            return
        }
        setTimeout(() => isActive.current = false, sec * 1000);
        setActiveDialog(true);
        isActive.current = true;
    }

    const activeSpecificLength = (length) => {
        if (length < 2){
            alert('適切な数値を入力してください！')
            return
        }
        limitLength.current = length;
        setActiveDialog(true);
        isActive.current = true;

    }

    const getGyro = (event) => {

    }

    const checkDialog = () => {
        if (navigator.userAgent.match('iPhone|iPad')) {
            window.DeviceMotionEvent.requestPermission().then((res) => {
                if (res != 'granted') {
                    alert('ブラウザを再起動してセンサー利用の許可をして下さい！');
                    return
        }})
        }
        window.addEventListener('devicemotion', getAcceleration);
        window.addEventListener('deviceorientation', getGyro);
        setIsArrow(true);
    }

    const renderCsvBtn = () => {
        const { t, x, y, z } = resultAcc
        const data = [
            ['time', 'x_acc', 'y_acc', 'z_acc'],
            ...resultAcc.x.map((el, i) => {
                return [t[i], x[i], y[i], z[i]]
            })
        ];
        return <CSVLink filename='Acceleration_data.csv' data={data}>CSVをダウンロード</CSVLink>
    }

    const renderChart = () => {
        const N = resultAcc.t.length;
        const dtAve = resultAcc.t.map((_,idx,arr) => {
            return idx != 0 ? arr[idx] - arr[idx-1] : 0
        }).reduce((prev,cur) => prev+cur) / (resultAcc.t.length - 1);
        const x = dft(resultAcc.x);
        const y = dft(resultAcc.y);
        const z = dft(resultAcc.z);
        const dftData = {
            freq: [...Array(N)].map((_, i) => (i * (1 / dtAve) / N).toFixed(2)).slice(0, Math.floor(N / 2) + 1),
            x: x.Re.map((_, index) => Math.sqrt(x.Re[index] ** 2 + x.Im[index] ** 2) / N * 2).slice(0, Math.floor(N / 2) + 1),
            y: y.Re.map((_, index) => Math.sqrt(y.Re[index] ** 2 + y.Im[index] ** 2) / N * 2).slice(0, Math.floor(N / 2) + 1),
            z: z.Re.map((_, index) => Math.sqrt(z.Re[index] ** 2 + z.Im[index] ** 2) / N * 2).slice(0, Math.floor(N / 2) + 1),
        }
        const data = {
            labels: resultAcc.t,
            datasets: [
                {
                    label: 'x',
                    data: resultAcc.x,
                    borderColor: 'green',
                    borderWidth: 1
                },
                {
                    label: 'y',
                    data: resultAcc.y,
                    borderColor: 'red',
                    borderWidth: 1
                },
                {
                    label: 'z',
                    data: resultAcc.z,
                    borderColor: 'black',
                    borderWidth: 1

                }
            ],
        }
        const data2 = {
            labels: dftData.freq,
            datasets: [
                {
                    label: 'x',
                    data: dftData.x,
                    borderColor: 'green',
                    borderWidth: 1
                },
                {
                    label: 'y',
                    data: dftData.y,
                    borderColor: 'red',
                    borderWidth: 1
                },
                {
                    label: 'z',
                    data: dftData.z,
                    borderColor: 'black',
                    borderWidth: 1
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
                        text: 'Acceleration result'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Times [s]',
                            color: 'black'

                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Acceleration [G]',
                            color: 'black'
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
                        text: 'DFT result'
                    }
                },
                scales: {
                    x: {

                        title: {
                            display: true,
                            text: 'Frequency [Hz]',
                            color: 'black'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amplitude',
                            color: 'black'
                        }
                    }
                }
            }
        }
         
        return (
            <div>
                <div style={{ border: 'solid 1px' }}>
                    <Line data={data} options={options1} />
                </div>
                <div style={{ border: 'solid 1px', marginTop: '1em' }}>
                    <Line data={data2} options={options2} />
                </div>
                <p>平均サンプリング周期 dt = {dtAve}</p>
            </div>
        )
    }

    const buttonStyle = {
        width: 100,
        height: 100,
        fontSize: 15
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
            <Box textAlign='center' display='flex' justifyContent='center' alignItems='center' height='500px'>
                    <Button variant='contained' color="error" style={buttonStyle} onClick={checkDialog} >センサー有効化</Button>
            </Box>
        )
    }

    return (
        <>
            <Dialog open={activeDialog}>
                <Box padding={10}>
                    計測中．．．
                </Box>
            </Dialog>
            <Dialog open={customTimeDialog}>
                <Box margin={10} textAlign='center'>
                    <p>時間長のカスタム</p>
                    <TextField label='秒' variant="filled" type='number' inputRef={customInputRef}></TextField>
                    <Box marginTop='10px'>
                        <Button variant='contained' onClick={() => activeSpecificTime(Number(customInputRef.current.value))}>測定</Button>
                        <Button variant='outlined' onClick={() => setCustomTimeDialog(false)}>キャンセル</Button>
                    </Box>
                </Box>
            </Dialog>
            <Dialog open={customLengthDialog}>
                <Box margin={10} textAlign='center'>
                    <p>データ長のカスタム</p>
                    <TextField variant="filled" type='number' inputRef={customInputRef}></TextField>
                    <Box marginTop='10px'>
                        <Button variant='contained' onClick={() => activeSpecificLength(Number(customInputRef.current.value))}>測定</Button>
                        <Button variant='outlined' onClick={() => setCustomLengthDialog(false)}>キャンセル</Button>
                    </Box>
                </Box>
            </Dialog>

            <Box textAlign='center'>
                <Box border='solid 1px black' padding={2} margin='20px 0'>
                    <Box>
                        <h5>
                            <p>取得範囲の指定</p>
                            <p>※開発者の環境(Iphone11)ではサンプリング周期 dt = 0.015</p>
                        </h5>
                        <Tabs value={optionValue} onChange={(e, newValue) => setOptionValue(newValue)} centered>
                            <Tab label='任意長' />
                            <Tab label='時間 t で指定' />
                            <Tab label='データ長 N で指定' />
                        </Tabs>
                    </Box>
                    <Box padding={1}>
                        {optionValue === 0 ?
                            <Box >
                                <Button variant='contained' color='primary' onTouchEnd={() => isActive.current = false} onTouchStart={() => isActive.current = true} style={{ width: '100%', height: 100 }}>長押しする間測定</Button>
                            </Box>
                            : optionValue === 1 ?
                                <Box overflow={'auto'} whiteSpace='nowrap'>
                                    <Button id={`time-button-custom`} variant='contained' color='error' style={buttonStyle} onClick={() => setCustomTimeDialog(true)}>カスタム</Button>
                                    {[1, 5, 10, 15, 30].map((el, idx) => <Button id={`time-button-${idx}`} variant='contained' color='primary' style={buttonStyle} onClick={() => activeSpecificTime(el)}>t = {el}秒</Button>)}
                                </Box>
                                :
                                <Box overflow={'auto'} whiteSpace='nowrap'>
                                    <Button id={`length-button-custom`} variant='contained' color='error' style={buttonStyle} onClick={() => setCustomLengthDialog(true)}>カスタム</Button>
                                    {[32, 128, 256, 512, 1024].map((el, idx) => <Button id={`length-button-${idx}`} variant='contained' color='primary' style={buttonStyle} onClick={() => activeSpecificLength(el)}>N = {el}</Button>)}
                                </Box>
                        }
                    </Box>
                </Box>
                {resultAcc ? renderChart() : null}
                {resultAcc ? renderCsvBtn() : null}
            </Box>
        </>
    )
}