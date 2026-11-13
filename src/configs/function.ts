import fs from "fs";
import path from "path";
import yaml from "js-yaml";

// Read YAML configuration
const readYaml = (filePath: string): Record<string, any> => {
  const fullPath = path.resolve(process.cwd(), filePath);
  const fileContent = fs.readFileSync(fullPath, "utf8");

  return yaml.load(fileContent) as Record<string, any> || {};
};


// Load API configurations
const auth = readYaml("src/ymls/apis/auth.yml");
const course = readYaml("src/ymls/apis/course.yml");
const registration = readYaml("src/ymls/apis/registration.yml");

// Combine all Lambda configurations
const functions = {
  ...auth,
  ...course,
  ...registration
};

export default functions;