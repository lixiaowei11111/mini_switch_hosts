use dirs;
use lazy_static::lazy_static;
use std::path::PathBuf;

pub const START_POSITION: &str = r#"#  --- MINI_HOSTS_START ---"#;
pub const END_POSITION: &str = r#"#  --- MINI_HOSTS_END ---"#;

#[cfg(target_os = "windows")]
pub const HOSTS_PATH: &str = r#"C:\Windows\System32\drivers\etc\hosts"#;

// TODO
#[cfg(any(target_os = "macos", target_os = "linux"))]
pub const HOSTS_PATH: &str = "/etc/hosts";

// TODO
#[cfg(target_os = "android")]
pub const HOSTS_PATH: &str = "/system/etc/hosts";

lazy_static! {
    pub static ref CONFIG_PATH: PathBuf = {
        let mut home = dirs::home_dir().expect("Failure to obtain the user's home directory");
        home.push(".mini_hosts");
        home
    };
    pub static ref ID_CONFIG_PATH: PathBuf = CONFIG_PATH.join("data").join("id_list");
    pub static ref LIST_PATH: PathBuf = CONFIG_PATH.join("data").join("list");
    pub static ref LOG_PATH: PathBuf = CONFIG_PATH.join("log");
}
