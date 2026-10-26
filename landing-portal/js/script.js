const textInputField = document.getElementById('text-area');
const firstButton = document.getElementById('first-button');
const display = document.getElementById('display');
const winnerDisplay = document.getElementById('display-winner');
const winnerButton = document.getElementById('winner');
const arrayOfText = [];

const space = `${' '}`;
const comma = `${','}`;
let count = 0;
let count2 = 0;

const textArray = (peep) => {
    const text = textInputField.value;
    const textArrayComma = text.split(peep);
    for(const text of textArrayComma){
        arrayOfText.push(text);
    }
}


const addItem = (peep) => {
    textArray(peep);
    console.log("mak", arrayOfText);
    if(textInputField.value === ''){
        alert('Plese Add Some Text In to Input Field')
        return;
    }
    for (item of arrayOfText) {
        const list = document.createElement('li');
        count = count+1;
        list.innerHTML = `<li class = "py-2 px-3 border-t-2 border-dashed border-gray-200">${count}. ${item}</li>`
        display.appendChild(list)
        textInputField.value = '';
        document.getElementById('input-container').classList.add('hidden');
    }
}

winnerButton.addEventListener('click', () => {
    let ArrayLength = arrayOfText.length;
    if(ArrayLength === 0){
        alert('Please Input Some Text First!')
        return;
    }

    console.log("mak", arrayOfText);
    const randomNumber = Math.random() * ArrayLength;
    const randomNumberRound = Math.floor(randomNumber);
    
    count2 = count2+1;
    const winnerList = document.createElement('li');

    winnerList.innerHTML = `<li class = "py-2 px-3 border-t-2 border-dashed border-gray-200">${count2}. ${arrayOfText[randomNumberRound]}</li>`

    const randomRotation = Math.random()*360;
    const randomDegree = Math.floor(randomRotation);
    
    const Circle = document.getElementById('circle');
    Circle.classList.add('spinneranimation'); 
    Circle.classList.add(`rotate-[${randomDegree}deg]`); 
    setTimeout(()=>{
        Circle.classList.remove('spinneranimation');
        winnerDisplay.appendChild(winnerList);
    },
    5000)

    console.log(randomDegree);
});