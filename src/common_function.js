//export function js file//

export const dft = (array) => {
    const N = array.length;
    let Re = [];
    let Im = [];
    [...Array(N)].forEach((_, t) => {
        const reSum = array.map((fx, x) => fx * Math.cos(2 * Math.PI * t * x / N)).reduce((prev, cur) => prev + cur);
        const imSum = array.map((fx, x) => -fx * Math.sin(2 * Math.PI * t * x / N)).reduce((prev, cur) => prev + cur);
        Re = [...Re, reSum];
        Im = [...Im, imSum];
    })
    return {
        Re: Re,
        Im: Im
    }
}

export const idft = (array) => {
    const N = array.length;
    let Re = [];
    let Im = [];
    [...Array(N)].forEach((_, time) => {
        const Re_sum = array.map((fx, x) => fx * Math.cos(2 * Math.PI * time * x / N)).reduce((prev, cur) => prev + cur);
        const Im_sum = array.map((fx, x) => fx * Math.sin(2 * Math.PI * time * x / N)).reduce((prev, cur) => prev + cur);
        Re = [...Re, Re_sum];
        Im = [...Im, Im_sum];
    })
    return { Re: Re.map(el => el / N), Im: Im.map(el => el / N) }
}