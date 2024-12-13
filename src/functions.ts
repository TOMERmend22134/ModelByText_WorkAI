import { Data, Input, Output } from "./types/dataTypes";
import vgsalesData from './vgsales.json';

//types
interface VgsalesData {
    Rank: number;
    Name: string;
    Platform: string;
    Year: string;
    Publisher: string;
    NA_Sales: number;
    EU_Sales: number;
    JP_Sales: number;
    Other_Sales: number;
    Global_Sales: number;
}

type OutputType = {
    [key: string]: number;
};

interface BagOfWords {
    [key: string]: number;
  }

//declaration of brain
declare const brain: any;

// Function to create the bag of words
function createBagOfWords(data: VgsalesData[]): BagOfWords {
    const bagOfWords: BagOfWords = {};
    let index = 0;
    data.forEach(game => {
      game.Name.split(/\s+/).forEach(word => {
        if (!(word in bagOfWords)) {
          bagOfWords[word] = index++;
        }
      });
    });
    return bagOfWords;
  }
  
  // Function to create training data
  function createTrainingData(data: VgsalesData[], bagOfWords: BagOfWords): { input: number[]; output: number[] }[] {
    const publishers = [...new Set(data.map(item => item.Publisher))];
    const publisherIndices: BagOfWords = {};
    publishers.forEach((pub, i) => publisherIndices[pub] = i);
  
/* This code snippet is part of the `createTrainingData` function. It is mapping over each item in the
`data` array, which represents a game in this context. For each game, it is creating an input array
and populating it based on the bag of words created earlier. */
    return data.map(item => {
      const input = new Array(Object.keys(bagOfWords).length).fill(0);
      item.Name.split(/\s+/).forEach(word => {
        const wordIndex = bagOfWords[word];
        if (wordIndex !== undefined) {
          input[wordIndex] = 1;
        }
      });
  
/* This code snippet is part of the `createTrainingData` function. It is creating an output array based
on the publishers of the games in the dataset. Here's a breakdown of what each step is doing: */
      const output = new Array(publishers.length).fill(0);
      const publisherIndex = publisherIndices[item.Publisher];
      if (publisherIndex !== undefined) {
        output[publisherIndex] = 1;
      }
  
      return { input, output };
    });
  }
  
  // Function to predict the publisher of a game
  function predictPublisher(
    gameName: string,
    processInput: (input: number[]) => number[], // This function is your neural network's prediction function.
    bagOfWords: BagOfWords,
    publishersList: string[]
  ): string {
    const input = new Array(Object.keys(bagOfWords).length).fill(0);
    gameName.split(/\s+/).forEach(word => {
      const wordIndex = bagOfWords[word];
      if (wordIndex !== undefined) {
        input[wordIndex] = 1;
      }
    });
  
    // Use the provided processInput function to get the output
    const output = processInput(input);
    const highestProbabilityIndex = output.findIndex(value => value === Math.max(...output));
    const predictedPublisher = publishersList[highestProbabilityIndex];
  
    return predictedPublisher;
  }
  
  // Assuming a trainModel function exists that trains your model and returns a prediction function
  function trainModel(trainingData: any) {
    // Create a new instance of a Neural Network
    const net = new brain.NeuralNetwork({
      hiddenLayers: [32], // This is a simple network with one hidden layer of 3 neurons
      iterations: 1000000, // The maximum times to iterate the training data
      learningRate: 0.1, // Global learning rate, useful when training using streams
      inputSize: 1,
      outputSize: 1
    });
  
    // Train the network with the prepared training data
    net.train(trainingData.map((item: any) => ({
      input: item.input,
      output: item.output
    })));

    // Display the Neural Network as an SVG
    (document.querySelector('#app') as HTMLDivElement).innerHTML = brain.utilities.toSVG(net);

  
    // The trained model is now ready to make predictions
    // We return a function that takes an input array and returns the processed output array
    return (input: any) => net.run(input);
  }
  
  // Main functionality to create the bag of words, train the model, and predict the publisher
  export function predictGamePublisher(gameName: string): void {
    const bagOfWords = createBagOfWords(vgsalesData);
    const trainingData = createTrainingData(vgsalesData, bagOfWords);
    const processInput = trainModel(trainingData);
    const publishersList = [...new Set(vgsalesData.map(item => item.Publisher))];
  
    const predictedPublisher = predictPublisher(gameName, processInput, bagOfWords, publishersList);
    console.log(`The predicted publisher for "${gameName}" is ${predictedPublisher}`);
  }
