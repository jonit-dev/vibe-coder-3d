use anyhow::{Context, Result};
use std::path::Path;
use std::process::{Command, Stdio};

pub struct Cmd {
    cmd: Command,
}

impl Cmd {
    pub fn new(program: &str) -> Self {
        Self {
            cmd: Command::new(program),
        }
    }

    pub fn arg(&mut self, arg: &str) -> &mut Self {
        self.cmd.arg(arg);
        self
    }

    pub fn args<I, S>(&mut self, args: I) -> &mut Self
    where
        I: IntoIterator<Item = S>,
        S: AsRef<std::ffi::OsStr>,
    {
        self.cmd.args(args);
        self
    }

    pub fn env(&mut self, key: &str, val: &str) -> &mut Self {
        self.cmd.env(key, val);
        self
    }

    pub fn current_dir<P: AsRef<Path>>(&mut self, dir: P) -> &mut Self {
        self.cmd.current_dir(dir);
        self
    }

    pub fn run(&mut self) -> Result<()> {
        let status = self
            .cmd
            .status()
            .with_context(|| format!("Failed to execute command: {:?}", self.cmd))?;

        if !status.success() {
            anyhow::bail!("Command failed with status: {}", status);
        }

        Ok(())
    }

    pub fn run_with_output(&mut self) -> Result<String> {
        let output = self
            .cmd
            .output()
            .with_context(|| format!("Failed to execute command: {:?}", self.cmd))?;

        if !output.status.success() {
            anyhow::bail!(
                "Command failed with status: {}\nStderr: {}",
                output.status,
                String::from_utf8_lossy(&output.stderr)
            );
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    pub fn run_piped_to_file(&mut self, output_path: &Path) -> Result<()> {
        let file = std::fs::File::create(output_path)
            .with_context(|| format!("Failed to create output file: {}", output_path.display()))?;

        self.cmd.stdout(Stdio::from(file));

        let status = self
            .cmd
            .status()
            .with_context(|| format!("Failed to execute command: {:?}", self.cmd))?;

        if !status.success() {
            anyhow::bail!("Command failed with status: {}", status);
        }

        Ok(())
    }
}
