// --- UUIDv4 generator (thanks to @broofa on StackOverflow)
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// --- Autosave

let queue = {};
let card_queue = {};
let set_id = window.location.pathname.split('/')[2];
let card_being_dragged = "";
let cardpos_initial = 0;
let cardpos_final = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var socket = io.connect(location.protocol + "//" + document.domain + ':' + location.port);

$(document).ready(function() {
    $('#options input, #options textarea').on("keyup", function (event) {
        queue[event.target.id] = $(event.target).val();
    });
    $('#options select').on("change", function (event) {
        queue[event.target.id] = $(event.target).val();
    })
});

function save(exit=false, manual=false) {
    // Allows for waiting until the save succeeds
    let finished_set = false;
    let finished_cards = false;
    let errors = false;
    if (!$.isEmptyObject(queue)) {
        let data = {...queue}  // Copy the queue
        data['set_id'] = set_id;
        socket.emit("update_set", data, (response) => {
            if (response === 'success') {
                finished_set = true;
                queue = {};
            }
            else {
                errors = true;
            }
        });
    }
    else { finished_set = true; }
    if (!$.isEmptyObject(card_queue)) {
        for (let card_id in card_queue) {
            let data = {...card_queue[card_id]};
            data['set_id'] = set_id;
            data['card_id'] = card_id
            socket.emit("update_card", data, (response) => {
                if (response === 'success') {
                    finished_cards = true;
                    card_queue = {};
                }
                else {
                    errors = true;
                }
            });
        }
    }
    else { finished_cards = true; }
    if (manual) {
        let interval
        interval = setInterval(function () {
            if (errors) {
                window.alert('There was an issue saving this set. Try again, or make a copy of your work and reload the page.')
                clearInterval(interval);
            }
            else if (finished_set && finished_cards) {
                if (exit) {
                    window.location.href = '..';
                }
                clearInterval(interval);
            }
        }, 200)
    }
}

setInterval(function() {
    save();
}, 5000)

// ---x

// --- Card operations

function delete_card(card_id) {
    $(`.card[data-card-id="${card_id}"]`).hide();
    socket.emit("delete_card", {"set_id": set_id, "card_id": card_id}, (response) => {
        if (response === 'success') {
            $(`.card[data-card-id="${card_id}"]`).remove();
        }
        else {
           $(`.card[data-card-id="${card_id}"]`).show();
           window.alert('Failed to delete card - try again or attempt to save and reload')
        }
    });
}

function add_card() {
    let temporary_id = 'temp' + uuidv4();
    $("#card-container").append(
        `<div class="card" data-card-id="${temporary_id}">
            <div class="card-header">
                <p><span class="material-symbols-outlined drag-handle">drag_handle</span></p>
                <p><span class="material-symbols-outlined delete-btn">delete</span></p>
            </div>
            <div class="card-body">
                <div class="card-content">
                    <form>
                        <label>Front<input type="text" class="card-text card-text-front" value=""></label>
                        <label>Back&nbsp;<input type="text" class="card-text card-text-back" value=""></label>
                    </form>
                </div>
                <div class="card-image">
                    <p class="cutout desktop">+</p>
                    <p class="cutout mobile">+ Image</p>
                </div>
            </div>
        </div>`
    );
    $(`.card[data-card-id='${temporary_id}']`).insertBefore('#new_card');
    socket.emit("new_card", {"set_id": set_id}, (response) => {
        console.log(response)
        if (response !== 401) {
            $(`.card[data-card-id=${temporary_id}] .card-text-front`).val(response['front']);
            $(`.card[data-card-id=${temporary_id}] .card-text-back`).val(response['back']);
            $(`.card[data-card-id=${temporary_id}]`).attr('data-card-id', response['id']);
        }
        else {
            $(`.card[data-card-id=${temporary_id}]`).remove();
            window.alert("Couldn't add a new card - try again or attempt to save and reload.");
        }
    });
}

function update_card(card_id, front, back) {
    card_queue[card_id] = {"front": front, "back": back};
}

function change_position(cardpos_initial, cardpos_final) {
    socket.emit("change_position", {
        "set_id": set_id,
        "initial": cardpos_initial,
        "final": cardpos_final
    });
}

// ---x

// --- Event listeners

$(document).ready(function() {
    // -- Buttons
    $("#card-container").on("click", ".card .delete-btn", function (event) {
        let card_id = $(event.target).parents().eq(2).data('card-id');
        delete_card(card_id);
    });
    $('#delete-set').on("click", function (event) {
        const response = confirm("Do you want to delete this set? This action CANNOT BE UNDONE!")
        if (response) {
            window.location.href = '../delete'
        }
    })
    // --x
    // -- Card inputs
    $("#card-container").on("change", ".card input", function (event) {
        let card_id = $(event.target).parents().eq(4).data('card-id');
        let form = $(event.target).parents().eq(1);
        let front = form.find('input').eq(0).val();
        let back = form.find('input').eq(1).val();
        update_card(card_id, front, back);
    })
    // --
    // -- Dragging
    $("#card-container").on("mousedown", ".card .drag-handle", function (event) {
        card_being_dragged = $(event.target).parents().eq(2);
        cardpos_initial = $(event.target).parents().eq(2).index();
    })
})

// ---x

// --- Card dragging

$(document).ready(function() {
    $("#card-container").sortable({
        axis: "y",
        containment: "#card-container",
        cursor: "grabbing",
        handle: ".drag-handle",
        stop: function (event) {
            cardpos_final = card_being_dragged.index();
            change_position(cardpos_initial, cardpos_final);
        }
    });
});