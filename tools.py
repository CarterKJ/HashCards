from string import ascii_letters, digits
from blake3 import blake3
import os


def is_valid_email(email: str) -> bool:
    email = email.split("@")
    if len(email) != 2:
        return False
    for character in email[0]:
        if character not in ascii_letters + digits + "!#$%&'*+-/=?^_`{|}~.":
            return False
    for character in email[1]:
        if character not in ascii_letters + digits + ".-":  # No underscores in domain names
            return False

    # Else
    return True


def sort_by_value(d, reverse=False):  # Thanks to Devin Jeanpierre on StackOverflow
    return {k: v for k, v in sorted(d.items(), key=lambda item: item[1], reverse=reverse)}


def hash_file(filename):
    with open(filename, "rb") as file:
        file_hash = blake3()
        chunk = file.read(8192)
        while chunk:
            file_hash.update(chunk)
            chunk = file.read(8192)
    return file_hash.hexdigest()


def listdir_recursive(directory, remove_extension=False):
    file_paths = []
    for root, directories, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            file_path = file_path.replace(directory + '/', '', 1)
            if remove_extension:
                file_path = '.'.join(file_path.split('.')[:-1])
            file_paths.append(file_path)
    return file_paths


def get_data_filenames(directory, preserve_extension=False):
    """
    Strips the mapfiles out of the directory listing
    :param directory:
    :return:
    """
    return [file if preserve_extension else '.'.join(file.split('.')[:-1]) for file in os.listdir(directory) if not file.startswith('_')]
