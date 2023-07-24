export class TokenNamesGenerator {
    public readonly noFurtherCombinations = 'no-further-combinations'

    private readonly symbols = [ ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ' ]
    private readonly combinationMinLength = 2
    private readonly combinationMaxLength = 5

    public getNextCombination(currentCombination: string): string {
        if (this.isVeryLastCombination(currentCombination) || this.noFurtherCombinations === currentCombination) {
            return this.noFurtherCombinations
        }

        if (!this.isValidCombination(currentCombination)) {
            return this.getVeryFirstCombination()
        }

        return this.calcNextCombination(currentCombination)
    }

    private isValidCombination(combination: string): boolean {
        if (combination.length > this.combinationMaxLength || combination.length < this.combinationMinLength) {
            return false
        }

        for (let i = 0; i < combination.length; i++) {
            if (!this.symbols.includes(combination[i])) {
                return false
            }
        }

        return true
    }

    private getVeryFirstCombination(): string {
        return this.firstSymbol().repeat(this.combinationMinLength)
    }

    private isLastCombinationWithCurrentLength(combination: string): boolean {
        const lastCombination = this.lastSymbol().repeat(combination.length)

        return lastCombination === combination
    }

    private calcNextCombination(currentCombination: string): string {
        if (this.isLastCombinationWithCurrentLength(currentCombination)) {
            return this.firstSymbol().repeat(currentCombination.length + 1)
        }

        const combinationNumber = this.convertCombinationToNumber(currentCombination)

        return this.convertNumberToConfiguration(combinationNumber + 1, currentCombination.length)
    }

    private isVeryLastCombination(combination: string): boolean {
        return this.combinationMaxLength === combination.length && this.isLastCombinationWithCurrentLength(combination)
    }

    private convertCombinationToNumber(configuration: string): number {
        let result = 0
        const characters = [ ...configuration ]

        characters.forEach((character, index) => {
            result += this.symbols.length ** index * this.symbols.indexOf(character)
        })

        return result
    }

    private convertNumberToConfiguration(number: number, configurationLength: number): string {
        let result = ''

        for (let i = 0; i < configurationLength; i++) {
            result += this.symbols[number % this.symbols.length]
            number = Math.trunc(number / this.symbols.length)
        }

        return result
    }

    private lastSymbol(): string {
        return this.symbols[this.symbols.length - 1]
    }

    private firstSymbol(): string {
        return this.symbols[0]
    }
}
