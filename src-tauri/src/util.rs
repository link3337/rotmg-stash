use rand::thread_rng;
use rand::Rng;

pub fn generate_hex_key(length: usize) -> String {
    // generate random bytes
    let random_bytes: Vec<u8> = thread_rng()
        .sample_iter(rand::distributions::Standard)
        .take(length)
        .collect();

    // convert bytes to hexadecimal string
    random_bytes
        .iter()
        .map(|byte| format!("{:02x}", byte))
        .collect::<String>()
}
