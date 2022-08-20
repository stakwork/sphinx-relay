import { toSnake } from '../../utils/case'

describe('Calculator Tests', () => {
  test('Addition of 2 numbers', async () => {
    const notSnakeObj = {
      superCamelCase: 20,
      nextValueHere: 'words',
    }

    const snaked_string = toSnake(notSnakeObj)
    const correct_snaked_string = {
      super_camel_case: 20,
      next_value_here: 'words',
    }

    expect(snaked_string).toStrictEqual(correct_snaked_string)
  })
})
