let autocatchrs = [
    {
        catches: [1,2,3,4]
    },
    {
        catches: [3,4,2,5,7]
    },
]

let pokemons = autocatchrs.map(x => x.catches).flat()
console.log(pokemons)