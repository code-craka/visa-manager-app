#!/bin/bash

# Helper script to configure JDK settings for the React Native project

# Define colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}React Native JDK Configuration Helper${NC}"
echo -e "${BLUE}========================================${NC}"

# Check for installed JDKs
echo -e "\n${YELLOW}Checking installed JDKs...${NC}"

if [ -f "/usr/libexec/java_home" ]; then
    echo -e "Found JDKs:"
    /usr/libexec/java_home -V 2>&1 | grep -v "Matching Java Virtual Machines"

    # Get current JDK path
    CURRENT_JDK=$(/usr/libexec/java_home)
    echo -e "\n${GREEN}Current active JDK:${NC} $CURRENT_JDK"
else
    echo "Cannot find /usr/libexec/java_home utility"
fi

# Check gradle.properties
GRADLE_PROPS="./android/gradle.properties"
if [ -f "$GRADLE_PROPS" ]; then
    echo -e "\n${YELLOW}Checking gradle.properties configuration...${NC}"
    JDK_SETTING=$(grep "org.gradle.java.home" "$GRADLE_PROPS")

    if [ -z "$JDK_SETTING" ]; then
        echo -e "${YELLOW}No JDK path set in gradle.properties${NC}"
    else
        echo -e "${GREEN}Found JDK setting:${NC} $JDK_SETTING"
    fi
else
    echo -e "\n${YELLOW}gradle.properties not found${NC}"
fi

# Display options
echo -e "\n${YELLOW}Options:${NC}"
echo "1. Use system default JDK: $CURRENT_JDK"
echo "2. Use custom JDK path"
echo "3. Exit"

read -p "Select option (1-3): " OPTION

case $OPTION in
    1)
        echo -e "\n${GREEN}Setting gradle.properties to use:${NC} $CURRENT_JDK"
        if [ -f "$GRADLE_PROPS" ]; then
            # Remove existing setting if it exists
            sed -i '' '/org.gradle.java.home=/d' "$GRADLE_PROPS"
            # Add new setting
            echo "" >> "$GRADLE_PROPS"
            echo "# Path to the JDK to use for building" >> "$GRADLE_PROPS"
            echo "org.gradle.java.home=$CURRENT_JDK" >> "$GRADLE_PROPS"
            echo -e "${GREEN}Successfully updated gradle.properties${NC}"
        else
            echo -e "${YELLOW}Cannot find gradle.properties to update${NC}"
        fi
        ;;
    2)
        echo -e "\n${YELLOW}Enter the full path to your preferred JDK:${NC}"
        read CUSTOM_JDK

        if [ -d "$CUSTOM_JDK" ]; then
            echo -e "${GREEN}Setting gradle.properties to use:${NC} $CUSTOM_JDK"
            if [ -f "$GRADLE_PROPS" ]; then
                # Remove existing setting if it exists
                sed -i '' '/org.gradle.java.home=/d' "$GRADLE_PROPS"
                # Add new setting
                # shellcheck disable=SC2129
                echo "" >> "$GRADLE_PROPS"
                echo "# Path to the JDK to use for building" >> "$GRADLE_PROPS"
                echo "org.gradle.java.home=$CUSTOM_JDK" >> "$GRADLE_PROPS"
                echo -e "${GREEN}Successfully updated gradle.properties${NC}"
            else
                echo -e "${YELLOW}Cannot find gradle.properties to update${NC}"
            fi
        else
            echo -e "${YELLOW}Invalid path: $CUSTOM_JDK${NC}"
        fi
        ;;
    3)
        echo -e "\n${GREEN}Exiting without changes${NC}"
        ;;
    *)
        echo -e "\n${YELLOW}Invalid option. Exiting without changes${NC}"
        ;;
esac

echo -e "\n${GREEN}Done!${NC}"
echo -e "${BLUE}========================================${NC}"

