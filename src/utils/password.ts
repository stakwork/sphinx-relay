
import * as crypto from 'crypto'

const password = crypto.randomBytes(16).toString('hex');

export default password
