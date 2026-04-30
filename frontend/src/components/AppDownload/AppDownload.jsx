import React from 'react';
import './AppDownload.css';

const AppDownload = () => {
    const reviews = [
        {
            name: 'Marcus Johnson',
            role: 'Nexa',
            review: 'Pizza Boy completely changed our team lunch routine. Orders arrive hot, the app feels effortless, and every box is packed with real care.',
            image: 'https://i.pravatar.cc/120?img=12',
            size: 'medium'
        },
        {
            name: 'Emily Chang',
            role: 'Luminate',
            review: 'As a remote team, Pizza Boy has been a game-changer for quick group orders. The menu has range, checkout is smooth, and delivery updates are always on time.',
            image: 'https://i.pravatar.cc/120?img=32',
            size: 'medium'
        },
        {
            name: 'Olivia Thompson',
            role: 'Glassi',
            review: 'Before discovering Pizza Boy, coordinating team meals felt messy. Now everything is in one place and the food quality has stayed consistently excellent.',
            image: 'https://i.pravatar.cc/120?img=47',
            size: 'tall'
        },
        {
            name: 'Samantha Rodriguez',
            role: 'Swiftify',
            review: 'I cannot say enough good things about Pizza Boy. From fresh slices to desserts that actually taste homemade, it has become our default favorite.',
            image: 'https://i.pravatar.cc/120?img=5',
            size: 'tall'
        },
        {
            name: 'Alexander Patel',
            role: 'Vexa',
            review: 'We have seen a huge boost in lunch satisfaction across the office. Great flavors, fast service, and a checkout flow that saves valuable time.',
            image: 'https://i.pravatar.cc/120?img=15',
            size: 'medium'
        },
        {
            name: 'Isabella Ramirez',
            role: 'Edge',
            review: 'Pizza Boy is simply amazing. It is quick, reliable, and always delivers comfort food that feels a little more premium than expected.',
            image: 'https://i.pravatar.cc/120?img=24',
            size: 'small'
        },
        {
            name: 'Noah Bennett',
            role: 'Brightly',
            review: 'The checkout is fast, the delivery timing is reliable, and the pasta options are way better than most late-night spots.',
            image: 'https://i.pravatar.cc/120?img=53',
            size: 'small'
        },
        {
            name: 'Aisha Khan',
            role: 'Northstar',
            review: 'From salads to dessert, every order feels thoughtful and fresh. Pizza Boy has become our easiest crowd-pleaser.',
            image: 'https://i.pravatar.cc/120?img=44',
            size: 'medium'
        },
        {
            name: 'Xavier Carter',
            role: 'Cucumber',
            review: 'Pizza Boy streamlines team lunch planning like never before. It is a must-have for any modern workplace.',
            image: 'https://i.pravatar.cc/120?img=61',
            size: 'small'
        }
    ];

    return (
        <section className='app-download testimonials-section' id='app-download'>
            <div className='testimonials-shell'>
                <div className='testimonials-copy'>
                    <span className='testimonials-eyebrow'>Testimonials</span>
                    <h2 className='app-download-heading'>What our customers say</h2>
                    <p className='app-download-subheading'>
                        Trusted by hungry regulars, office teams, and family dinner planners who want bold flavor and smooth delivery every time.
                    </p>
                </div>
                <div className='testimonials-grid'>
                    {reviews.map((review, cardIndex) => (
                        <article
                            className={`testimonial-card testimonial-card-${review.size}`}
                            key={review.name}
                            style={{ animationDelay: `${cardIndex * 0.18}s` }}
                        >
                            <div className='testimonial-stars' aria-hidden='true'>
                                {[...Array(5)].map((_, index) => (
                                    <span key={index}>{'\u2605'}</span>
                                ))}
                            </div>
                            <p className='testimonial-review'>{review.review}</p>
                            <div className='testimonial-card-top'>
                                <div className='testimonial-person'>
                                    <img src={review.image} alt={review.name} className='testimonial-avatar-img' />
                                    <div>
                                        <h3>{review.name}</h3>
                                        <p>{review.role}</p>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AppDownload;
