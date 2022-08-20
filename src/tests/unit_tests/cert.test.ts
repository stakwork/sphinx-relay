import { toSnake, toCamel } from '../../utils/case'

describe('tests for src/utils/case', () => {
  const notSnakeObj = {
    superCamelCase: 20,
    nextValueHere: 'words',
  }
  const correct_snaked_string = {
    super_camel_case: 20,
    next_value_here: 'words',
  }

  test('toSnake', async () => {
    const snaked_string = toSnake(notSnakeObj)

    expect(snaked_string).toStrictEqual(correct_snaked_string)
  })

  test('toCamel', async () => {
    const camel_string = toCamel(correct_snaked_string)

    expect(camel_string).toStrictEqual(notSnakeObj)
  })
})
