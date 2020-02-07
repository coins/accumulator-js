import { mod_exp, egcd } from '../../numbers-js/src/numbers.js';
import { Primes } from '../../primes-js/src/primes.js';
// import { hashToPrime } from './primes-hash.js';

// RSA-2048 https://en.wikipedia.org/wiki/RSA_numbers#RSA-2048
const m = 25195908475657893494027183240048398571429282126204032027777137836043662020707595556264018525880784406918290641249515082189298559149176184502808489120072844992687392807287776735971418347270261896375014971824691165077613379859095700097330459748808428401797429100642458691817195118746121515172654632282216869987549182422433637259085141865462043576798423387184774447920739934236584823824281198163815010674810451660377306056201619676256133844143603833904414952634432190114657544454178424020924616515723350778707749817125772467962926386356373289912154831438167899885040445364023527381951378636564391212010397122822120720357n

// generator
const g = 2n;

class BasicAccumulator {

    constructor(state) {
        this._state = state || g;
    }

    add(element) {
        const proof = this._state;
        this._state = mod_exp(this._state, element, m);
        return new InclusionProof(proof, element);
    }

    delete(element, proof) {
        if (!this._state == mod_exp(proof, element, m)) throw 'Invalid proof';
        this._state = proof;
    }

    log() {
        console.log('accu state:', this._state);
    }

    get state() {
        return this._state;
    }
}

export class Accumulator extends BasicAccumulator {

    constructor(state) {
        super(state);
    }

    add(key, value) {
        const element = mapToPrime(key, value);
        return super.add(element);
    }

    delete(key, value, proof) {
        const element = mapToPrime(key, value);
        super.delete(element);
    }
}





class InclusionProof {

    constructor(proof, element) {
        this._proof = proof;
        this._element = element;
    }

    add(other) {
        this._proof = mod_exp(this._proof, other.element, m);
    }

    delete(other) {
        this._proof = shamirTrick(this._proof, other.proof, this._element, other.element, m);
    }

    aggregate(other) {
        this.delete(other);
        this._element *= other.element;
    }

    verify(root) {
        return root === mod_exp(this._proof, this._element, m);
    }

    log() {
        console.log('element:', this._element, '\nproof:', this._proof);
    }

    get proof() {
        return this._proof;
    }

    get element() {
        return this._element;
    }
}

/*
	
	Maps key-value pairs to prime numbers
	
*/

function mapToPrime(key, value) {
    return BigInt(Primes.nth(Primes.nth(32 + key) * value));
}

/*
	
	Shamir Trick
	
*/

function shamirTrick(p1, p2, x, y, n) {
    const [a, b, g] = egcd(x, y);
    return (mod_exp(p1, b, n) * mod_exp(p2, a, n)) % n
}


/*
	
	Proof of Exponentiation	
	
*/

// Some arbitrary prime ( It is the prime of the finite field of secp256k1 )
const LARGE_PRIME = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;

function proveExponentiation(g, x, l = LARGE_PRIME) {
    const q = x / l; 
    return mod_exp(g, q, m);
}

function verifyExponentiation(y, g, x, proof, l = LARGE_PRIME) {
    const r = x % l;
    return y === (mod_exp(proof, l, m) * mod_exp(g, r, m) % m);
}

/*
	
	Side note
	if l = 2 and x mod 2 == 0, then:
	y == proof * proof	(mod m)

	// TODO: what is a save value for l ?
	
*/
