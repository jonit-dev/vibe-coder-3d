///! Generic schema validation for detecting unexpected/unknown properties in JSON
///!
///! This module provides low-level validation that works with any serde-deserializable type.
///! It detects properties in the JSON that don't match the expected Rust struct schema.
use serde_json::Value;
use std::collections::HashSet;

/// Validate a JSON object against expected field names and warn about unknowns
///
/// # Arguments
/// * `obj` - The JSON object to validate
/// * `expected_fields` - Set of field names that are expected/valid
/// * `context` - Context string for error messages (e.g., "Material 'my_material'")
///
/// # Returns
/// * Number of unknown fields detected
pub fn validate_fields(
    obj: &serde_json::Map<String, Value>,
    expected_fields: &HashSet<&str>,
    context: &str,
) -> usize {
    let mut unknown_count = 0;

    for (key, value) in obj.iter() {
        if !expected_fields.contains(key.as_str()) {
            unknown_count += 1;
            log::warn!("⚠️  {}: Unknown property '{}' = {:?}", context, key, value);
            log::warn!("   This property will be ignored. Check for typos or schema mismatch.");
        }
    }

    unknown_count
}

/// Try to deserialize and report unknown fields via serde error messages
///
/// This is a fallback when we don't have an explicit field list.
/// It attempts deserialization and parses serde error messages.
///
/// # Arguments
/// * `json_value` - The JSON value to deserialize
/// * `context` - Context string for error messages
///
/// # Returns
/// * Result of deserialization (Ok even if there were unknown fields with defaults)
pub fn deserialize_with_warnings<T>(json_value: &Value, context: &str) -> Result<T, String>
where
    T: serde::de::DeserializeOwned,
{
    match serde_json::from_value::<T>(json_value.clone()) {
        Ok(result) => Ok(result),
        Err(e) => {
            let error_msg = e.to_string();

            // Check for unknown field errors
            if error_msg.contains("unknown field") {
                if let Some(field_name) = extract_unknown_field(&error_msg) {
                    log::warn!("⚠️  {}: Unknown field '{}' in JSON", context, field_name);
                }
            }

            // Check for missing required fields
            if error_msg.contains("missing field") {
                if let Some(field_name) = extract_missing_field(&error_msg) {
                    log::warn!("⚠️  {}: Missing required field '{}'", context, field_name);
                }
            }

            Err(error_msg)
        }
    }
}

/// Extract unknown field name from serde error message
/// Example: "unknown field `foo`, expected one of ..." -> "foo"
fn extract_unknown_field(error_msg: &str) -> Option<&str> {
    error_msg.split("unknown field `").nth(1)?.split('`').next()
}

/// Extract missing field name from serde error message
/// Example: "missing field `bar`" -> "bar"
fn extract_missing_field(error_msg: &str) -> Option<&str> {
    error_msg.split("missing field `").nth(1)?.split('`').next()
}

/// Create a HashSet from a list of expected field names
///
/// Convenience macro for creating expected field sets
#[macro_export]
macro_rules! expected_fields {
    ($($field:expr),* $(,)?) => {{
        let mut set = std::collections::HashSet::new();
        $(
            set.insert($field);
        )*
        set
    }};
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_validate_fields_no_unknowns() {
        let obj = json!({
            "name": "test",
            "value": 42
        });

        let expected = expected_fields!["name", "value"];
        let unknown_count = validate_fields(obj.as_object().unwrap(), &expected, "Test");

        assert_eq!(unknown_count, 0);
    }

    #[test]
    fn test_validate_fields_with_unknowns() {
        let obj = json!({
            "name": "test",
            "value": 42,
            "unknown_field": "oops",
            "another_unknown": 123
        });

        let expected = expected_fields!["name", "value"];
        let unknown_count = validate_fields(obj.as_object().unwrap(), &expected, "Test");

        assert_eq!(unknown_count, 2);
    }

    #[test]
    fn test_extract_unknown_field() {
        let error = "unknown field `foo`, expected one of `bar`, `baz`";
        assert_eq!(extract_unknown_field(error), Some("foo"));
    }

    #[test]
    fn test_extract_missing_field() {
        let error = "missing field `required_field`";
        assert_eq!(extract_missing_field(error), Some("required_field"));
    }
}
