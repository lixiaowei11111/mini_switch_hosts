use std::fs::File;
use std::io::{Read, Write};
use std::vec::Vec;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::constants::ID_CONFIG_PATH;
use super::error::AnyHowResult;
use super::group::{add_group_detail, del_group_detail};
use super::util::{generate_id, get_system_hosts_update_time};
use crate::err_to_string;

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq)]
pub enum Status {
    ON,
    OFF,
}

#[derive(Serialize, Deserialize)]
pub struct Group {
    pub name: String,
    pub id: usize,
    pub uuid: Uuid,
    pub status: Status,
    #[serde(rename = "isDelete")]
    pub is_delete: bool,
    #[serde(rename = "updateTime")]
    pub update_time: i64,
}
type GroupList = Vec<Group>;

pub fn get_system_group() -> AnyHowResult<Group> {
    let hosts_group = Group {
        id: 0usize,
        name: String::from("系统"),
        uuid: Uuid::new_v4(),
        status: Status::ON,
        is_delete: false,
        update_time: get_system_hosts_update_time()?,
    };
    Ok(hosts_group)
}

#[tauri::command]
pub fn read_conf(need_system: bool) -> AnyHowResult<GroupList> {
    let mut file = err_to_string!(File::open(&*ID_CONFIG_PATH))?;
    let mut contents = String::new();
    err_to_string!(file.read_to_string(&mut contents))?;
    let mut groups: GroupList = err_to_string!(serde_json::from_str(&contents))?;

    if need_system && !groups.iter().any(|group| group.id == 0) {
        let hosts_group = get_system_group()?;
        groups.insert(0, hosts_group);
    }
    groups = groups
        .into_iter()
        .filter(|group| !group.is_delete)
        .collect();
    Ok(groups)
}

#[tauri::command]
pub fn update_conf(groups: Vec<Group>) -> AnyHowResult {
    let contents = err_to_string!(serde_json::to_string(&groups))?;
    let mut file = err_to_string!(File::create(&*ID_CONFIG_PATH))?;
    err_to_string!(file.write_all(contents.as_bytes()))?;
    Ok(())
}

#[tauri::command]
pub fn update_group_status(id: usize, status: Status) -> AnyHowResult {
    let mut groups = read_conf(false)?;
    use chrono::Utc;
    for group in &mut groups {
        if group.id == id {
            group.status = status;
            group.update_time = Utc::now().timestamp();
            break;
        }
    }
    update_conf(groups)?;
    Ok(())
}

#[tauri::command]
pub fn del_single_group(id: usize) -> AnyHowResult {
    let groups = read_conf(false)?;
    use chrono::Utc;
    let groups = groups
        .into_iter()
        .filter_map(|mut g| {
            if g.id == id {
                g.is_delete = true;
                g.update_time = Utc::now().timestamp();
            }
            Some(g)
        })
        .collect();
    update_conf(groups)?;
    del_group_detail(id)?;
    Ok(())
}

#[tauri::command]
pub fn add_single_group(name: String) -> AnyHowResult<usize> {
    let mut groups = read_conf(false)?;
    let id = generate_id()?;
    let uuid = Uuid::new_v4();
    add_group_detail(id, uuid)?; // keep order
    let group = Group {
        name,
        id,
        uuid,
        status: Status::ON,
        is_delete: false,
        update_time: Utc::now().timestamp(),
    };
    groups.push(group);
    update_conf(groups)?;
    Ok(id)
}
