 #!/usr/bin/env zsh

function check_exit() {
    last_exit_code=$?

    if [ $last_exit_code -ne 0 ]; 
    then 
        echo "Last command failed with exit code: $last_exit_code."
        echo "Exiting."
        exit $last_exit_code; 
    fi
}
