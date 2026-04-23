pub fn generate_hex_key(length: usize) -> String {
    let random_bytes: Vec<u8> = (0..length).map(|_| rand::random::<u8>()).collect();

    random_bytes
        .iter()
        .map(|byte| format!("{:02x}", byte))
        .collect::<String>()
}
