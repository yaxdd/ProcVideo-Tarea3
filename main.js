const cv = require('opencv4nodejs');
const math = require('mathjs')
//Cargo las imagenes
let image = cv.imread('rect_1.png').cvtColor(cv.COLOR_RGB2GRAY);
let imagenA = cv.imread('rect_2_1.png').cvtColor(cv.COLOR_RGB2GRAY);
let imagenB = cv.imread('rect_2_2.png').cvtColor(cv.COLOR_RGB2GRAY);
let imagenC = cv.imread('rect_2_3.png').cvtColor(cv.COLOR_RGB2GRAY);
let imagenD = cv.imread('rect_2_4.png').cvtColor(cv.COLOR_RGB2GRAY);

//Primera parte, Fuerza bruta
//genero los desplazamientos
// let desplazamientos=makeMovements(image.sizes[0],image.sizes[1])
// //obtengo los resultados de toddas las imagenes
// let resultadoA=findMoveBruteForce(image,imagenA,desplazamientos)
// let resultadoB=findMoveBruteForce(image,imagenB,desplazamientos)
// let resultadoC=findMoveBruteForce(image,imagenC,desplazamientos)
// let resultadoD=findMoveBruteForce(image,imagenD,desplazamientos)
// //Imprimo los resultados
// console.log({
//     resultadoA,
//     resultadoB,
//     resultadoC,
//     resultadoD,
// })
//  let output=moveImage(image,resultadoA)
//  cv.imwrite("imagenA.png",output)
//  output=moveImage(image,resultadoB)
//  cv.imwrite("imagenB.png",output)
//  output=moveImage(image,resultadoC)
//  cv.imwrite("imagenC.png",output)
//  output=moveImage(image,resultadoD)
//  cv.imwrite("imagenD.png",output)


     let wut=lucasKanadeParams(imagenA,image.getDataAsArray())
     console.log(wut)

// try{
    
// }catch(e){
//     // console.log(e)
// }
// cv.imwrite("moveimage.png",output)
// let imagePadded = imagePadding(image, 1)
// let kernelX = [
//     [1, 0, -1],
//     [1, 0, -1],
//     [1, 0, -1]
// ];
// let kernelY = [
//     [1, 1, 1],
//     [0, 0, 0],
//     [-1, -1, -1]
// ];

// let derivadaX = imageDerivative(imagePadded, kernelX)
// let derivadaY = imageDerivative(imagePadded, kernelY)

// cv.imwrite('derivadaX.png', derivadaX);
// cv.imwrite('derivadaY.png', derivadaY);

function imagePadding(image, padSize) {
    //si la imagen es RGB la pasamos a escala de grises primero
    if (image.channels === 3)
        image = image.cvtColor(cv.COLOR_RGB2GRAY)
    //conseguimos las dimensiones de la imagen
    let [sizeX, sizeY] = image.sizes;
    //generamos una nueva imagen con los bordes añadidos
    let output = new cv.Mat(sizeX + 2 * padSize, sizeY + 2 * padSize, cv.CV_8UC1);
    //ahora copiamos la imagen original dentro de los bordes sin modificarla
    for (let i = padSize; i < sizeX + padSize; i++) {
        for (let j = padSize; j < sizeY + padSize; j++) {
            let pixel = image.atRaw(i - padSize, j - padSize);
            output.set(i, j, pixel);
        }
    }
    return output;
}

function imageDerivative(image, kernel) {
    //obtenemos las dimensiones de la imagen
    let [sizeX, sizeY] = image.sizes;
    //obtenemos el tamaño del relleno basandonos en el tamaño del kernel
    let padSize = 2 * math.floor((kernel.length / 2));
    //generamos una nueva imagen sin los bordes que le asignemos
    let temp =math.zeros(sizeX - padSize, sizeY - padSize)._data; 
     let output = new cv.Mat(temp, cv.CV_8UC1);
    // let output = new cv.Mat(sizeX - padSize, sizeY - padSize, cv.CV_8UC1);

    //ahora recorremos la imagen con relleno pero sin pasarnos de los limites,
    for (let i = 1; i < (sizeX - 2*padSize); i++) {
        for (let j = 1; j < (sizeY - 2*padSize); j++) {
            //la subregion empieza desde el punto i,j hasta i+padSize+1,j+padSize+1
            let subRegion = image.getRegion(new cv.Rect(j, i, padSize + 1, padSize + 1)).getDataAsArray()
            //ahora multiplicamos con el kernel,sumamos todos los elementos y dividimos entre 3
            let sum = math.sum(math.dotMultiply(subRegion, kernel)) / (padSize+1)
            //asignamos en la imagen de salida
            output.set(i, j,sum)
        }
    }
    return output.getDataAsArray()
}

function lucasKanadeParams(image,reference){
    let kernelX = [
        [1, 0, -1],
        [1, 0, -1],
        [1, 0, -1]
    ];
    let kernelY = [
        [1, 1, 1],
        [0, 0, 0],
        [-1, -1, -1]
    ];
    try {
    let imagePadded=imagePadding(image,1)
    let derivadaX = imageDerivative(imagePadded, kernelX)
    let derivadaY = imageDerivative(imagePadded, kernelY)
    let sumX=math.sum(math.square(derivadaX));//EIx^2
    let sumY=math.sum(math.square(derivadaY));//EIy^2
    let sumXY=math.sum(math.dotMultiply(derivadaX,derivadaY))//EIxy^2
    cv.imwrite("derivadaX.png",new cv.Mat(math.abs(math.square(derivadaX)),cv.CV_8UC1))
    cv.imwrite("derivadaY.png",new cv.Mat(math.abs(math.square(derivadaY)),cv.CV_8UC1))
    cv.imwrite("derivadaXY.png",new cv.Mat(math.abs(math.dotMultiply(derivadaX,derivadaY)),cv.CV_8UC1))
    
    let temp=math.subtract(reference,image.getDataAsArray())
    // console.log(temp)
        let A= math.inv([[sumX,sumXY],[sumXY,sumY]])
        let b=[math.sum(math.dotMultiply(temp,derivadaX)),
            math.sum(math.dotMultiply(temp,derivadaY)),
        ]
        return math.usolve(A,b)
    } catch (error) {
        console.log(error)
        throw new Error("wut")
    }
}

function moveImage(image,desplazamiento){
    let [sizeX, sizeY] = image.sizes;
    let vector={
        x:desplazamiento[0],
        y:desplazamiento[1],
    }
    let temp =math.zeros(image.sizes[0],image.sizes[1])._data; 
     let output = new cv.Mat(temp, cv.CV_8UC1);
    // console.log(output)
    for (let i = 0; i < sizeX ; i++) {
        for (let j = 0; j < sizeY; j++) {
            
            if ((i+vector.x)<sizeX && (j+vector.y)<sizeY&&(i+vector.x)>=0&&(j+vector.y)>=0){
            output.set(i+vector.x,j+vector.y,image.atRaw(i,j))
            }
        }
    }
    return output
}

function makeMovements(N){
    let array=[];
    for (let i=Math.floor(-N/2);i<=Math.ceil(N/2);i++){
        array.push(i)
        
    }
    return array;
}

function findMoveBruteForce(image,imagenMovida,desplazamientos){
    let error=Number.MAX_SAFE_INTEGER;
    let substraction=[];
    let product=[];
    let sum=0;
    let index=[];
console.time("find");
try {
    for (let i =0;i<desplazamientos.length;i++){
        for (let j =0;j<desplazamientos.length;j++){

                substraction=image.sub(moveImage(imagenMovida,[desplazamientos[i],desplazamientos[j]])).getDataAsArray()
                product = math.square(substraction)
                sum=(math.sum(product))
                 if (sum<error){
                     error=sum;
                    index=[-desplazamientos[i],-desplazamientos[j]]
                }
                if (error<0.0001){
                    console.timeEnd("find")
                    return {index,error}
                }
            }
        }   
    } catch (e) {
        return {error:Infinity,index:[Infinity,Infinity]}
    }
    console.timeEnd("find")
    return {index,error}
}
