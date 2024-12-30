// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_directory,
            copy_file,
            save_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    use std::fs;
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn copy_file(source: String, destination: String) -> Result<(), String> {
    use std::fs;
    fs::copy(source, destination).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn save_file_content(path: String, content: String) -> Result<(), String> {
    use std::fs;
    fs::write(path, content).map_err(|e| e.to_string())
}

// use walkdir::WalkDir;
// use std::collections::HashMap;

// fn discover_components(base_path: &str) -> HashMap<String, usize> {
//     let mut components = HashMap::new();
//     components.insert("Skins".to_string(), 0);
//     components.insert("@Vault".to_string(), 0);
//     components.insert("Plugins".to_string(), 0);
//     components.insert("Layouts".to_string(), 0);

//     for entry in WalkDir::new(base_path) {
//         let entry = entry.unwrap();
//         let path = entry.path().to_str().unwrap_or("");
//         if path.ends_with("Skins") {
//             components.insert("Skins".to_string(), entry.file_type().is_dir() as usize);
//         } else if path.ends_with("@Vault") {
//             components.insert("@Vault".to_string(), entry.file_type().is_dir() as usize);
//         } else if path.ends_with("Plugins") {
//             components.insert("Plugins".to_string(), entry.file_type().is_dir() as usize);
//         } else if path.ends_with("Layouts") {
//             components.insert("Layouts".to_string(), entry.file_type().is_dir() as usize);
//         }
//     }
//     components
// }

// use std::fs;
// use ini::Ini; // Corrected import

// fn parse_rmskin_ini(base_path: &str) -> (String, String) {
//     let ini_path = format!("{}/RMSKIN.ini", base_path);
//     let conf = Ini::load_from_file(ini_path).unwrap(); // Updated to use Ini
//     let section = conf.section(Some("rmskin")).expect("Section 'rmskin' not found in the INI file");
//     let name = section.get("Name").unwrap_or("DefaultName").to_string();
//     let version = section.get("Version").unwrap_or("1.0").to_string();
//     (name, version)
// }

// use image::io::Reader as ImageReader;
// use image::ImageFormat;

// fn validate_header_image(base_path: &str) {
//     let img_path = format!("{}/RMSKIN.bmp", base_path);
//     let img = ImageReader::open(&img_path).unwrap().decode().unwrap();
//     let resized = img.resize_exact(400, 60, image::imageops::FilterType::Triangle);
//     resized.save_with_format(img_path, ImageFormat::Bmp).unwrap();
// }

// use zip::write::FileOptions;
// use std::fs::File;
// use std::io::Write;
// use std::io::Read;

// fn create_rmskin_archive(base_path: &str, output_path: &str) {
//     let archive_file = File::create(output_path).unwrap();
//     let mut zip = zip::ZipWriter::new(archive_file);

//     let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);
//     let skins_path = format!("{}/Skins", base_path);

//     for entry in WalkDir::new(&skins_path) {
//         let entry = entry.unwrap();
//         let path = entry.path().to_str().unwrap();
//         if entry.file_type().is_file() {
//             let name_in_zip = path.strip_prefix(base_path).unwrap();
//             zip.start_file(name_in_zip, options).unwrap();
//             let mut file = File::open(path).unwrap();
//             let mut buffer = Vec::new();
//             file.read_to_end(&mut buffer).unwrap();
//             zip.write_all(&buffer).unwrap();
//         }
//     }
//     zip.finish().unwrap();
// }

// use std::io::{Seek, SeekFrom};

// fn append_footer_to_archive(output_path: &str) {
//     let mut file = File::options().append(true).open(output_path).unwrap();
//     let footer = b"\x00RMSKIN\x00";
//     file.write_all(footer).unwrap();
// }

// #[tauri::command]
// fn create_rmskin(base_path: String, output_path: String) -> Result<String, String> {
//     discover_components(&base_path);
//     let (name, version) = parse_rmskin_ini(&base_path);
//     validate_header_image(&base_path);
//     create_rmskin_archive(&base_path, &output_path);
//     append_footer_to_archive(&output_path);
//     Ok(format!("{} created successfully!", output_path))
// }

// ------------------------------------------------------------------

// use std::fs::{self, File};
// use std::io::{self, Write};
// // use std::path::Path;

// #[tauri::command]
// fn create_rmskin(input_dir: String, output_file: String) -> Result<String, String> {
//     let zip_path = format!("{}.zip", output_file);
//     let rmskin_path = format!("{}.rmskin", output_file);

//     // Step 1: Create .zip archive
//     let zip_file = File::create(&zip_path).map_err(|e| e.to_string())?;
//     let mut zip = zip::ZipWriter::new(zip_file);
//     let options = zip::write::FileOptions::default();

//     for entry in walkdir::WalkDir::new(&input_dir) {
//         let entry = entry.map_err(|e| e.to_string())?;
//         let path = entry.path();

//         // Skip the root directory itself
//         if path == std::path::Path::new(&input_dir) {
//             continue;
//         }

//         let relative_path = path.strip_prefix(&input_dir).map_err(|e| e.to_string())?;
//         let relative_path_str = relative_path.to_str().ok_or("Invalid path")?;

//         if path.is_file() {
//             // Add files to the zip archive
//             zip.start_file(relative_path_str, options).map_err(|e| e.to_string())?;
//             let data = fs::read(&path).map_err(|e| e.to_string())?;
//             zip.write_all(&data).map_err(|e| e.to_string())?;
//         } else if path.is_dir() {
//             // Add directories to the zip archive (optional but good practice)
//             zip.add_directory(relative_path_str, options).map_err(|e| e.to_string())?;
//         }
//     }
//     zip.finish().map_err(|e| e.to_string())?;

//     // Step 2: Add RMSKIN footer
//     let mut zip_file = File::open(&zip_path).map_err(|e| e.to_string())?;
//     let mut rmskin_file = File::create(&rmskin_path).map_err(|e| e.to_string())?;
//     io::copy(&mut zip_file, &mut rmskin_file).map_err(|e| e.to_string())?;

//     let size = fs::metadata(&zip_path).map_err(|e| e.to_string())?.len();
//     rmskin_file.write_all(&size.to_le_bytes()).map_err(|e| e.to_string())?;
//     rmskin_file.write_all(&[0]).map_err(|e| e.to_string())?;
//     rmskin_file.write_all(b"RMSKIN\0").map_err(|e| e.to_string())?;

//     // Clean up the .zip file
//     fs::remove_file(&zip_path).map_err(|e| e.to_string())?;

//     Ok(rmskin_path)
// }
