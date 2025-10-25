# Smart CSV/JSON Viewer

A Visual Studio Code extension that lets you view and explore CSV and JSON files directly inside the editor.  
It automatically detects the file type and displays either a collapsible tree view for JSON or a formatted table for CSV.

## Features

**CSV Viewer**  
- Displays CSV data in a formatted table  
- Alternating row colors for readability  
- Adapts automatically to light or dark themes  

**JSON Viewer**  
- Shows JSON data as a collapsible tree structure  
- Expand and collapse nested objects and arrays  
- Color coding for strings, numbers, booleans, and null values  
- Styled to match the current VS Code theme  

## Requirements

No configuration is required.  
The extension works with any `.csv` or `.json` file.  
To use it, open a file and run the command **"Open Smart CSV/JSON Viewer"** from the Command Palette.

## Extension Settings

This extension does not add custom settings at the moment.  
Future updates may include display preferences such as default sorting or auto-collapse depth.

## Known Issues

- Large files may take longer to render depending on system performance  
- Very deeply nested JSON structures might scroll beyond the visible area

## Release Notes

### 0.0.2
- Added automatic detection for CSV and JSON files  
- Added collapsible JSON tree view  
- Added theme-aware styling for both views  

### 0.0.1
- Initial version with basic JSON table view

## Contributing

If you find a bug or have suggestions for new features, open an issue or submit a pull request on GitHub.

## License

This extension is released under the MIT License.
