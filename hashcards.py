"""
hashcards.py
============
This file contains the essential backend functions needed to create and modify sets.
It does not contain other essential high-level functions such as account management.
"""

from pyntree import Node
from datetime import datetime
from copy import copy
from uuid import uuid4
import os

SET_TEMPLATE = {
    "id": None,
    "title": "Unnamed set",
    "description": "",
    "author": None,
    "crtime": None,
    "mdtime": None,
    "org": None,
    "group": None,
    "visibility": 'private',
    "cards": {},
    "card_order": [],
    "subject": None,
    "views": 0,
}

CARD_TEMPLATE = {
    "id": None,
    "front": None,
    "back": None,
    "image": None,
}


def create_set(
        user_id: str,
        title: str = "",
        subject: str = None,
        org_id: str = None,
        group_id: str = None,
        is_public: bool = False) -> str:
    """
    Create a new set and save it
    :param user_id:
    :param title:
    :param subject:
    :param org_id:
    :param group_id:
    :param is_public:
    :return: The set id
    """
    template = copy(SET_TEMPLATE)
    set = Node(template)
    set.id = str(uuid4())
    set.title = title
    set.author = user_id
    set.crtime = datetime.now()
    set.mdtime = datetime.now()
    set.org = org_id
    set.group_id = group_id
    set.public = is_public
    set.subject = subject
    set.save(f"db/sets/{set.id()}.pyn")
    return set.id()


def delete_set(set_id: str) -> None:
    """
    Delete the specified set
    :param set_id:
    :return:
    """
    os.remove(f"db/sets/{set_id}.pyn")


def create_card(front: str, back: str, image: str) -> dict:
    """
    Create a new card from the template and return it
    :param front:
    :param back:
    :param image:
    :return:
    """
    card = copy(CARD_TEMPLATE)
    card['id'] = str(uuid4())
    card['front'] = front
    card['back'] = back
    card['image'] = image
    return card


def add_card(set_id: str, front: str, back: str, image: str = None):
    """
    Add a new card to the specified set
    :param set_id:
    :param front:
    :param back:
    :param image:
    :return:
    """
    card = create_card(front, back, image=image)
    set = Node(f'db/sets/{set_id}.pyn')
    set.cards.set(card['id'], card)
    set.card_order().append(card['id'])
    set.mdtime = datetime.now()
    set.save()
    return card['id']


def modify_card(set_id, card_id, **kwargs) -> None:
    """
    Modify a card in a specified set
    :param set_id:
    :param card_id:
    :param kwargs:
    :return:
    """
    set = Node(f'db/sets/{set_id}.pyn')
    card = set.cards.get(card_id)
    for kwarg in kwargs:
        card.set(kwarg, kwargs[kwarg])
    set.mdtime = datetime.now()
    set.save()


def delete_card(set_id, card_id) -> None:
    """
    Delete a card from a specified set
    :param set_id:
    :param card_id:
    :return:
    """
    set = Node(f'db/sets/{set_id}.pyn')
    set.cards.delete(card_id)
    set.card_order().remove(card_id)
    set.mdtime = datetime.now()
    set.save()


def is_author(set_id: str, author_id: str) -> bool:
    """
    Determine whether the specified user is the author of the specified set
    :param set_id:
    :param author_id:
    :return: True or False
    """
    set = Node(f'db/sets/{set_id}.pyn')
    if set.author() == author_id:
        return True
    else:
        return False
